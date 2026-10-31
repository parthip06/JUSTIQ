"""
Unit tests for Machine Learning models (Model 1 Priority, Model 2 Duration).
"""

import unittest
from src.priority_classifier import predict_single_priority, load_priority_artifacts
from src.duration_predictor import predict_single_duration, load_duration_artifacts


class TestModels(unittest.TestCase):

    def test_priority_classifier(self):
        res = predict_single_priority(
            case_type="Habeas Corpus / Preventive Detention",
            case_year=1965,
            num_hearings=2,
            bench_size=2,
        )
        self.assertIn("predicted_priority", res)
        self.assertIn(res["predicted_priority"], ["High", "Medium", "Low"])
        self.assertGreaterEqual(res["confidence"], 0.0)
        self.assertLessEqual(res["confidence"], 1.0)
        self.assertIn("explanation", res)

    def test_duration_predictor(self):
        res = predict_single_duration(
            case_type="Civil Appeal - Property",
            num_hearings=8,
            bench_size=2,
            case_year=1965,
        )
        self.assertIn("predicted_days", res)
        self.assertGreaterEqual(res["predicted_days"], 14, "Predicted days should be at least physical minimum 14")
        self.assertGreater(res["predicted_months"], 0)
        self.assertGreater(res["predicted_years"], 0)


if __name__ == "__main__":
    unittest.main()
