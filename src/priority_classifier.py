"""
Model 1: Court Case Priority Classifier using Decision Tree.
Provides interpretable classification into High, Medium, and Low Priority.
Exposes real-time probability estimates, feature importance, and tree rule explanations.
"""

import os
import json
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
import joblib
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)

from src.preprocessing import prepare_priority_dataset, load_raw_dataset
from src.feature_engineering import build_priority_preprocessor, get_feature_names

MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "priority_tree_model.joblib")
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, "priority_preprocessor.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "priority_metrics.json")


def train_priority_model(
    df: Optional[pd.DataFrame] = None,
    max_depth: int = 5,
    min_samples_leaf: int = 15,
    random_state: int = 42,
    test_size: float = 0.2,
) -> Dict[str, Any]:
    """
    Train and persist the Decision Tree Priority Classifier.
    Evaluates against a stratified holdout set and saves model artifacts.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)
    if df is None:
        df = load_raw_dataset()

    X, y = prepare_priority_dataset(df)

    # Train/Test Split (Stratified to maintain class proportions)
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    # Build and fit preprocessor on training data only
    preprocessor = build_priority_preprocessor()
    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)

    # Train Decision Tree
    clf = DecisionTreeClassifier(
        max_depth=max_depth,
        min_samples_leaf=min_samples_leaf,
        random_state=random_state,
        criterion="gini",
    )
    clf.fit(X_train, y_train)

    # Predictions & Evaluation
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)

    feature_names = get_feature_names(preprocessor)
    labels = list(clf.classes_)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))
    cm = confusion_matrix(y_test, y_pred, labels=labels).tolist()
    clf_rep = classification_report(y_test, y_pred, labels=labels, output_dict=True, zero_division=0)

    # Tree feature importances
    importances = dict(zip(feature_names, clf.feature_importances_.tolist()))
    sorted_importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))

    metrics = {
        "model_name": "Decision Tree Priority Classifier",
        "algorithm": "DecisionTreeClassifier",
        "hyperparameters": {
            "max_depth": max_depth,
            "min_samples_leaf": min_samples_leaf,
            "random_state": random_state,
        },
        "classes": labels,
        "test_size": test_size,
        "train_samples": int(X_train.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "classification_report": clf_rep,
        "feature_importances": sorted_importances,
    }

    # Persist artifacts
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(preprocessor, PREPROCESSOR_PATH)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Priority Model trained successfully! Accuracy: {acc:.4f}, Weighted F1: {f1:.4f}")
    return metrics


def load_priority_artifacts() -> Tuple[DecisionTreeClassifier, Any, Dict[str, Any]]:
    """Load serialized model, preprocessor, and performance metrics."""
    if not (os.path.exists(MODEL_PATH) and os.path.exists(PREPROCESSOR_PATH)):
        train_priority_model()
    
    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    metrics = {}
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            metrics = json.load(f)
            
    return model, preprocessor, metrics


def predict_single_priority(
    case_type: str,
    case_year: int,
    num_hearings: int,
    bench_size: int,
    case_age_days: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Inference helper for a single case.
    Returns predicted priority, class probabilities, and legal rationale.
    """
    model, preprocessor, _ = load_priority_artifacts()

    if case_age_days is None:
        case_age_days = max(1, (1976 - case_year) * 365)

    input_df = pd.DataFrame([{
        "case_type": case_type,
        "case_year": case_year,
        "num_hearings_simulated": num_hearings,
        "bench_size": bench_size,
        "case_age_days": case_age_days,
    }])

    X_enc = preprocessor.transform(input_df)
    predicted_class = str(model.predict(X_enc)[0])
    probabilities = {
        cls_name: round(float(prob), 4)
        for cls_name, prob in zip(model.classes_, model.predict_proba(X_enc)[0])
    }
    confidence = probabilities[predicted_class]

    # Generate explanatory rationale
    explanation = _generate_priority_explanation(case_type, num_hearings, predicted_class, confidence)

    return {
        "predicted_priority": predicted_class,
        "confidence": confidence,
        "probabilities": probabilities,
        "explanation": explanation,
    }


def _generate_priority_explanation(case_type: str, num_hearings: int, priority: str, confidence: float) -> str:
    """Generate interpretable judicial explanation for the predicted priority."""
    if priority == "High":
        return (
            f"The case is predicted as HIGH PRIORITY ({confidence*100:.1f}% confidence). "
            f"Case category '{case_type}' typically involves critical constitutional liberties, "
            f"urgent personal liberty, or statutory deadlines warranting expedited disposal."
        )
    elif priority == "Medium":
        return (
            f"The case is classified as MEDIUM PRIORITY ({confidence*100:.1f}% confidence). "
            f"Criminal appeals, standard writ petitions, or matters with {num_hearings} accumulated hearings "
            f"require balanced scheduling to prevent prolonged institutional pendency."
        )
    else:
        return (
            f"The case is classified as LOW PRIORITY ({confidence*100:.1f}% confidence). "
            f"Commercial, revenue, or civil property disputes typically undergo standard evidentiary stages "
            f"without acute constitutional urgency."
        )


if __name__ == "__main__":
    metrics = train_priority_model()
    test_pred = predict_single_priority(
        case_type="Habeas Corpus / Preventive Detention",
        case_year=1968,
        num_hearings=2,
        bench_size=2,
    )
    print("Test Inference:", test_pred)
