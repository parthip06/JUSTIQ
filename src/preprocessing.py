"""
Data Preprocessing Pipeline for Court Case Prioritization & Scheduling Agent.
Handles data ingestion, validation, imputation, and feature extraction.
Guarantees zero data leakage between pre-judgment inputs and post-judgment targets.
"""

import os
from typing import Tuple, Dict, Any, Optional
import pandas as pd
import numpy as np

REFERENCE_DATE = pd.to_datetime("1976-01-01")

LEGAL_CASE_TYPES = [
    "Constitutional / Writ Petition",
    "Civil Appeal - Property",
    "Criminal Appeal",
    "Income Tax / Revenue",
    "Civil Appeal - General",
    "Company / Commercial",
    "Habeas Corpus / Preventive Detention",
    "Labour / Industrial Dispute",
    "Election Petition",
    "Bail Matter",
]

PRIORITY_LEVELS = ["High", "Medium", "Low"]


def load_raw_dataset(filepath: Optional[str] = None) -> pd.DataFrame:
    """Load the raw Supreme Court dataset from standard locations."""
    if filepath and os.path.exists(filepath):
        path = filepath
    elif os.path.exists("data/raw/supreme_court_dataset.csv"):
        path = "data/raw/supreme_court_dataset.csv"
    elif os.path.exists("data/raw/supreme_court_combined_dataset (1).csv"):
        path = "data/raw/supreme_court_combined_dataset (1).csv"
    else:
        # Fallback to absolute search or relative path
        alt = os.path.expanduser("~/Downloads/supreme_court_combined_dataset (1).csv")
        if os.path.exists(alt):
            path = alt
        else:
            raise FileNotFoundError("Could not locate supreme_court_dataset.csv.")
    
    df = pd.read_csv(path)
    return df


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and validate dataset records.
    - Standardize text columns (strip whitespace).
    - Impute bench_size == 0 to standard Division Bench size (2).
    - Parse datetime fields with error handling.
    - Derive pre-judgment pending age relative to reference date.
    """
    df = df.copy()

    # Text column stripping
    text_cols = ["case_id", "petitioner", "respondent", "case_type", 
                 "priority_level_simulated", "assigned_judge_simulated"]
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    # Impute bench_size where 0 or missing
    # In Indian Supreme Court jurisprudence, benches are at minimum single (1) or division (2).
    df["bench_size_imputed"] = (df["bench_size"] == 0).astype(int)
    df.loc[df["bench_size"] == 0, "bench_size"] = 2

    # Datetime conversions
    if "filing_date_simulated" in df.columns:
        df["filing_date"] = pd.to_datetime(df["filing_date_simulated"], errors="coerce")
    if "judgment_date" in df.columns:
        df["judgment_date_dt"] = pd.to_datetime(df["judgment_date"], errors="coerce")

    # Case Age calculation (days pending from filing date to end of dataset reference horizon)
    if "filing_date" in df.columns:
        df["case_age_days"] = (REFERENCE_DATE - df["filing_date"]).dt.days
        df["case_age_days"] = df["case_age_days"].clip(lower=1)
        df["case_age_years"] = (df["case_age_days"] / 365.25).round(2)
    else:
        df["case_age_days"] = (1976 - df["case_year"]) * 365
        df["case_age_years"] = 1976 - df["case_year"]

    return df


def prepare_priority_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Prepares features (X) and target (y) for Model 1: Priority Classifier.
    STRICT LEAKAGE CONTROL:
    - Never include judgment_date, case_duration_days_simulated, or target derivatives.
    - Only include features available at prediction time:
      ['case_type', 'case_year', 'num_hearings_simulated', 'bench_size', 'case_age_days']
    """
    cleaned = clean_dataset(df)
    
    feature_cols = [
        "case_type",
        "case_year",
        "num_hearings_simulated",
        "bench_size",
        "case_age_days",
    ]
    X = cleaned[feature_cols].copy()
    y = cleaned["priority_level_simulated"].copy()
    
    return X, y


def prepare_duration_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Prepares features (X) and target (y) for Model 2: Case Duration Predictor.
    STRICT LEAKAGE CONTROL:
    - Excludes judgment_date and post-judgment metadata.
    - Features: ['case_type', 'num_hearings_simulated', 'bench_size', 'case_year']
    - Target: case_duration_days_simulated
    """
    cleaned = clean_dataset(df)
    
    feature_cols = [
        "case_type",
        "num_hearings_simulated",
        "bench_size",
        "case_year",
    ]
    X = cleaned[feature_cols].copy()
    y = cleaned["case_duration_days_simulated"].copy()
    
    return X, y


def save_processed_dataset(output_path: str = "data/processed/cleaned_cases.csv") -> pd.DataFrame:
    """Run full pipeline and persist the processed CSV."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    raw_df = load_raw_dataset()
    cleaned_df = clean_dataset(raw_df)
    cleaned_df.to_csv(output_path, index=False)
    print(f"Processed dataset successfully saved to {output_path} ({cleaned_df.shape[0]} rows, {cleaned_df.shape[1]} columns)")
    return cleaned_df


if __name__ == "__main__":
    df = save_processed_dataset()
    print("Dataset Summary:")
    print(df[["case_id", "case_type", "priority_level_simulated", "case_duration_days_simulated", "case_age_days"]].head())
