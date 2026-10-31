"""
Feature Engineering module for Court Case Prioritization & Scheduling.
Builds robust ColumnTransformers and encodings with unknown-category resilience.
"""

from typing import List, Tuple
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def build_priority_preprocessor() -> ColumnTransformer:
    """
    Constructs feature preprocessor for Model 1 (Priority Decision Tree).
    Encodes categorical case_type using OneHotEncoder with handle_unknown='ignore'.
    Passes through numerical features.
    """
    categorical_features = ["case_type"]
    numerical_features = ["case_year", "num_hearings_simulated", "bench_size", "case_age_days"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                categorical_features,
            ),
            (
                "num",
                "passthrough",
                numerical_features,
            ),
        ],
        remainder="drop",
    )
    return preprocessor


def build_duration_preprocessor() -> ColumnTransformer:
    """
    Constructs feature preprocessor for Model 2 (Linear Regression Duration Predictor).
    Encodes categorical case_type. Numerical features passed through directly.
    """
    categorical_features = ["case_type"]
    numerical_features = ["num_hearings_simulated", "bench_size", "case_year"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                categorical_features,
            ),
            (
                "num",
                "passthrough",
                numerical_features,
            ),
        ],
        remainder="drop",
    )
    return preprocessor


def get_feature_names(transformer: ColumnTransformer) -> List[str]:
    """Extract human-readable feature names after one-hot encoding."""
    try:
        return list(transformer.get_feature_names_out())
    except Exception:
        return []
