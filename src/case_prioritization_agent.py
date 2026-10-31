"""
AI Case Prioritization Agent.
Integrates ML priority predictions, duration forecasts, case age, and hearing history
to compute a transparent, multi-factor ranking score for pending court cases.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

from src.priority_classifier import load_priority_artifacts
from src.duration_predictor import load_duration_artifacts

DEFAULT_WEIGHTS = {
    "priority_weight": 0.40,
    "age_weight": 0.25,
    "hearings_weight": 0.15,
    "duration_weight": 0.10,
    "urgency_weight": 0.10,
}

PRIORITY_SCORE_MAP = {
    "High": 1.0,
    "Medium": 0.5,
    "Low": 0.2,
}

URGENT_CASE_TYPES = {
    "Bail Matter": 1.0,
    "Habeas Corpus / Preventive Detention": 0.9,
    "Election Petition": 0.7,
    "Constitutional / Writ Petition": 0.5,
    "Criminal Appeal": 0.4,
}


class CasePrioritizationAgent:
    """
    Intelligent decision-support agent that synthesizes machine learning predictions
    and court operational factors to rank pending cases transparently.
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or DEFAULT_WEIGHTS.copy()
        self._normalize_weights()
        self.priority_model, self.priority_preprocessor, _ = load_priority_artifacts()
        self.duration_model, self.duration_preprocessor, _ = load_duration_artifacts()

    def _normalize_weights(self):
        """Ensure weights sum to 1.0."""
        total = sum(self.weights.values())
        if total > 0:
            self.weights = {k: v / total for k, v in self.weights.items()}

    def update_weights(self, new_weights: Dict[str, float]):
        """Dynamically update ranking factor weights."""
        self.weights.update(new_weights)
        self._normalize_weights()

    def score_and_rank_dataframe(
        self,
        df: pd.DataFrame,
        use_ml_predictions: bool = True,
        top_n: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Rank a cohort of cases with complete factor breakdown.
        """
        cases = df.copy()

        # Step 1: Obtain or verify Priority
        if use_ml_predictions:
            # Batch predict priority with Model 1
            input_p = cases[["case_type", "case_year", "num_hearings_simulated", "bench_size", "case_age_days"]].copy()
            X_p = self.priority_preprocessor.transform(input_p)
            cases["ml_predicted_priority"] = self.priority_model.predict(X_p)
            effective_priority = cases["ml_predicted_priority"]
        else:
            effective_priority = cases.get("priority_level_simulated", "Medium")

        cases["effective_priority"] = effective_priority
        cases["priority_score"] = cases["effective_priority"].map(PRIORITY_SCORE_MAP).fillna(0.3)

        # Step 2: Obtain or verify Estimated Duration
        if use_ml_predictions:
            input_d = cases[["case_type", "num_hearings_simulated", "bench_size", "case_year"]].copy()
            X_d = self.duration_preprocessor.transform(input_d)
            raw_dur = self.duration_model.predict(X_d)
            cases["ml_predicted_duration_days"] = np.clip(np.round(raw_dur), 14, 2500).astype(int)
            effective_duration = cases["ml_predicted_duration_days"]
        else:
            effective_duration = cases.get("case_duration_days_simulated", 365)

        cases["effective_duration_days"] = effective_duration

        # Step 3: Compute Normalized Factor Scores (0.0 to 1.0)
        # Age Factor: Older cases get higher urgency to prevent systemic delay
        max_age = cases["case_age_days"].max() if cases["case_age_days"].max() > 0 else 1
        cases["age_score"] = (cases["case_age_days"] / max_age).clip(0.0, 1.0)

        # Hearings Factor: Cases with more hearings require resolution
        max_hearings = cases["num_hearings_simulated"].max() if cases["num_hearings_simulated"].max() > 0 else 1
        cases["hearings_score"] = (cases["num_hearings_simulated"] / max_hearings).clip(0.0, 1.0)

        # Duration Factor (Fast-Track component): Shorter matters can be quickly disposed
        # Higher score for quicker cases = (1 - duration/max_duration)
        max_dur = cases["effective_duration_days"].max() if cases["effective_duration_days"].max() > 0 else 1
        cases["duration_score"] = (1.0 - (cases["effective_duration_days"] / max_dur)).clip(0.0, 1.0)

        # Urgency Indicator: Statutory/constitutional urgency bonus
        cases["urgency_score"] = cases["case_type"].map(URGENT_CASE_TYPES).fillna(0.1)

        # Step 4: Calculate Composite Ranking Score
        w = self.weights
        cases["composite_score"] = (
            w["priority_weight"] * cases["priority_score"]
            + w["age_weight"] * cases["age_score"]
            + w["hearings_weight"] * cases["hearings_score"]
            + w["duration_weight"] * cases["duration_score"]
            + w["urgency_weight"] * cases["urgency_score"]
        )

        cases["composite_score"] = (cases["composite_score"] * 100).round(2)

        # Sort descending by composite score
        cases = cases.sort_values(by=["composite_score", "case_age_days"], ascending=[False, False]).reset_index(drop=True)
        cases["priority_rank"] = cases.index + 1

        if top_n is not None:
            cases = cases.head(top_n)

        return cases


def get_prioritization_agent(weights: Optional[Dict[str, float]] = None) -> CasePrioritizationAgent:
    """Factory method for CasePrioritizationAgent."""
    return CasePrioritizationAgent(weights=weights)


if __name__ == "__main__":
    from src.preprocessing import clean_dataset, load_raw_dataset
    df = clean_dataset(load_raw_dataset())
    agent = get_prioritization_agent()
    ranked = agent.score_and_rank_dataframe(df.head(50))
    print("Top 5 Ranked Cases:")
    print(ranked[["priority_rank", "case_id", "case_type", "effective_priority", "composite_score"]].head())
