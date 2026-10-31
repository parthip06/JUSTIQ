"""
FastAPI REST API Server for CCPA & CCDS System.
Provides high-performance, asynchronous REST endpoints for:
- Registry Statistics & Case Explorations
- ML Inference (Priority Decision Tree Model 1, Duration Linear Regression Model 2)
- AI Prioritization Agent & Dynamic Ranking
- SQLite Case Persistence & Judge Rostering
"""

import os
import json
import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure models and database are available
from src.preprocessing import load_raw_dataset, clean_dataset, LEGAL_CASE_TYPES, PRIORITY_LEVELS
from src.priority_classifier import predict_single_priority, load_priority_artifacts
from src.duration_predictor import predict_single_duration, load_duration_artifacts
from src.case_prioritization_agent import CasePrioritizationAgent, DEFAULT_WEIGHTS
from database.database import (
    init_database,
    fetch_all_cases,
    fetch_judge_roster,
)

# Initialize Database Schema
init_database()

# Load and cache cleaned dataset in-memory
CLEANED_DATASET: Optional[pd.DataFrame] = None


def get_cached_dataset() -> pd.DataFrame:
    global CLEANED_DATASET
    if CLEANED_DATASET is None:
        raw_df = load_raw_dataset()
        CLEANED_DATASET = clean_dataset(raw_df)
    return CLEANED_DATASET


app = FastAPI(
    title="justiq API - Justice delayed is justice denied",
    description="High-performance backend API powering justiq",
    version="2.0.0",
)

# Enable CORS for React frontend (Vite default: http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pre-load ML models into memory at startup
@app.on_event("startup")
def startup_event():
    print("Loading Supreme Court dataset and ML models into memory...")
    get_cached_dataset()
    load_priority_artifacts()
    load_duration_artifacts()
    print("Priority and Duration models cached successfully!")


# ---------------------------------------------------------
# Pydantic Schemas for Request / Response Validation
# ---------------------------------------------------------

class PriorityRequest(BaseModel):
    case_type: str = Field(..., example="Constitutional / Writ Petition")
    case_year: int = Field(1968, ge=1950, le=2026)
    num_hearings: int = Field(4, ge=1, le=50)
    bench_size: int = Field(2, ge=1, le=13)
    case_age_days: Optional[int] = None


class DurationRequest(BaseModel):
    case_type: str = Field(..., example="Civil Appeal - Property")
    num_hearings: int = Field(6, ge=1, le=50)
    bench_size: int = Field(2, ge=1, le=13)
    case_year: int = Field(1968, ge=1950, le=2026)


class PrioritizationRequest(BaseModel):
    cohort_size: int = Field(300, ge=10, le=7378)
    use_ml_predictions: bool = True
    weights: Optional[Dict[str, float]] = None


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "database": "connected",
        "models_loaded": True,
    }


@app.get("/api/stats")
def get_registry_stats():
    """Returns high-level statistics across all 7,378 case records."""
    df = get_cached_dataset()

    total_records = len(df)
    avg_duration = round(float(df["case_duration_days_simulated"].mean()), 1)
    avg_hearings = round(float(df["num_hearings_simulated"].mean()), 2)
    high_priority_count = int((df["priority_level_simulated"] == "High").sum())
    high_priority_pct = round((high_priority_count / total_records) * 100, 1)

    # Case type distribution
    type_counts = df["case_type"].value_counts().to_dict()
    case_type_counts = [{"case_type": k, "count": int(v)} for k, v in type_counts.items()]

    # Priority level distribution
    pri_counts = df["priority_level_simulated"].value_counts().to_dict()
    priority_counts = [{"priority": k, "count": int(v)} for k, v in pri_counts.items()]

    # Year trends
    year_trends = df.groupby("case_year").agg({
        "case_id": "count",
        "case_duration_days_simulated": "mean",
    }).reset_index()
    year_trends.rename(columns={"case_id": "case_count", "case_duration_days_simulated": "avg_duration"}, inplace=True)
    year_data = [
        {"year": int(row["case_year"]), "count": int(row["case_count"]), "avg_duration": round(float(row["avg_duration"]), 1)}
        for _, row in year_trends.iterrows()
    ]

    # Average duration by case type
    dur_by_type = df.groupby("case_type")["case_duration_days_simulated"].mean().round(1).to_dict()
    dur_data = [{"case_type": k, "avg_duration": float(v)} for k, v in sorted(dur_by_type.items(), key=lambda x: x[1], reverse=True)]

    def load_metrics_file(path: str) -> Dict[str, Any]:
        if os.path.exists(path):
            with open(path) as f:
                return json.load(f)
        return {}

    return {
        "summary": {
            "total_records": total_records,
            "avg_duration_days": avg_duration,
            "avg_duration_years": round(avg_duration / 365.25, 2),
            "avg_hearings": avg_hearings,
            "high_priority_count": high_priority_count,
            "high_priority_pct": high_priority_pct,
            "case_categories_count": df["case_type"].nunique(),
        },
        "case_type_distribution": case_type_counts,
        "priority_distribution": priority_counts,
        "year_trends": year_data,
        "duration_by_type": dur_data,
        "model_metrics": {
            "priority": load_metrics_file("models/priority_metrics.json"),
            "duration": load_metrics_file("models/duration_metrics.json"),
        },
    }


@app.get("/api/cases")
def query_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    search: Optional[str] = None,
    case_type: Optional[str] = None,
    priority: Optional[str] = None,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None,
):
    """Paginated, multi-filter case docket querying."""
    df = get_cached_dataset()
    filtered = df

    if search:
        s = search.strip().lower()
        filtered = filtered[
            filtered["case_id"].str.lower().str.contains(s)
            | filtered["petitioner"].str.lower().str.contains(s)
            | filtered["respondent"].str.lower().str.contains(s)
        ]

    if case_type:
        filtered = filtered[filtered["case_type"] == case_type]

    if priority:
        filtered = filtered[filtered["priority_level_simulated"] == priority]

    if year_min is not None:
        filtered = filtered[filtered["case_year"] >= year_min]

    if year_max is not None:
        filtered = filtered[filtered["case_year"] <= year_max]

    total = len(filtered)
    total_pages = max(1, (total + page_size - 1) // page_size)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size

    page_data = filtered.iloc[start_idx:end_idx]

    cols = [
        "case_id",
        "case_year",
        "case_type",
        "priority_level_simulated",
        "case_duration_days_simulated",
        "num_hearings_simulated",
        "bench_size",
        "assigned_judge_simulated",
        "petitioner",
        "respondent",
        "filing_date_simulated",
        "judgment_date",
        "source_file",
    ]

    records = []
    for _, row in page_data[cols].iterrows():
        records.append({
            "case_id": str(row["case_id"]),
            "case_year": int(row["case_year"]),
            "case_type": str(row["case_type"]),
            "priority": str(row["priority_level_simulated"]),
            "duration_days": int(row["case_duration_days_simulated"]),
            "hearings": int(row["num_hearings_simulated"]),
            "bench_size": int(row["bench_size"]),
            "assigned_judge": str(row["assigned_judge_simulated"]),
            "petitioner": str(row["petitioner"]),
            "respondent": str(row["respondent"]),
            "filing_date": str(row["filing_date_simulated"]),
            "judgment_date": str(row["judgment_date"]),
            "source_file": str(row["source_file"]),
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "cases": records,
    }


@app.get("/api/cases/{case_id}")
def get_case_dossier(case_id: str):
    """Retrieve complete dossier for a single case."""
    df = get_cached_dataset()
    match = df[df["case_id"].str.lower() == case_id.strip().lower()]
    if match.empty:
        raise HTTPException(status_code=404, detail="Case record not found.")

    row = match.iloc[0]
    return {
        "case_id": str(row["case_id"]),
        "petitioner": str(row["petitioner"]),
        "respondent": str(row["respondent"]),
        "case_year": int(row["case_year"]),
        "case_type": str(row["case_type"]),
        "priority": str(row["priority_level_simulated"]),
        "case_duration_days": int(row["case_duration_days_simulated"]),
        "num_hearings": int(row["num_hearings_simulated"]),
        "bench_size": int(row["bench_size"]),
        "bench_judges": str(row["bench_judges"]) if pd.notnull(row["bench_judges"]) else "Not recorded",
        "assigned_judge": str(row["assigned_judge_simulated"]),
        "filing_date": str(row["filing_date_simulated"]),
        "judgment_date": str(row["judgment_date"]),
        "source_file": str(row["source_file"]),
        "case_age_days": int(row.get("case_age_days", 1000)),
    }


@app.post("/api/predict/priority")
def predict_priority_endpoint(payload: PriorityRequest):
    """Model 1: Decision Tree Priority Classifier inference."""
    try:
        res = predict_single_priority(
            case_type=payload.case_type,
            case_year=payload.case_year,
            num_hearings=payload.num_hearings,
            bench_size=payload.bench_size,
            case_age_days=payload.case_age_days,
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict/duration")
def predict_duration_endpoint(payload: DurationRequest):
    """Model 2: Linear Regression Duration Predictor inference."""
    try:
        res = predict_single_duration(
            case_type=payload.case_type,
            num_hearings=payload.num_hearings,
            bench_size=payload.bench_size,
            case_year=payload.case_year,
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/prioritize")
def prioritize_cases_endpoint(payload: PrioritizationRequest):
    """AI Prioritization Agent: Multi-factor ranking calculation."""
    try:
        df = get_cached_dataset().head(payload.cohort_size)
        agent = CasePrioritizationAgent(weights=payload.weights)
        ranked = agent.score_and_rank_dataframe(df, use_ml_predictions=payload.use_ml_predictions)

        records = []
        for _, row in ranked.iterrows():
            records.append({
                "priority_rank": int(row["priority_rank"]),
                "case_id": str(row["case_id"]),
                "case_type": str(row["case_type"]),
                "effective_priority": str(row["effective_priority"]),
                "composite_score": float(row["composite_score"]),
                "case_age_days": int(row["case_age_days"]),
                "effective_duration_days": int(row["effective_duration_days"]),
                "num_hearings": int(row["num_hearings_simulated"]),
                "assigned_judge": str(row.get("assigned_judge_simulated", "Judge_01")),
            })

        high_count = (ranked["effective_priority"] == "High").sum()
        med_count = (ranked["effective_priority"] == "Medium").sum()
        low_count = (ranked["effective_priority"] == "Low").sum()

        return {
            "total_ranked": len(records),
            "summary": {
                "high_priority_count": int(high_count),
                "medium_priority_count": int(med_count),
                "low_priority_count": int(low_count),
                "top_score": float(ranked["composite_score"].max()),
                "avg_score": round(float(ranked["composite_score"].mean()), 2),
            },
            "cases": records,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/judges")
def get_judges():
    """Active Supreme Court judge roster from SQLite."""
    roster_df = fetch_judge_roster()
    return roster_df.to_dict(orient="records")
