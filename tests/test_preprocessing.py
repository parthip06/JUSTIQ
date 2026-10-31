"""
Unit tests for data preprocessing and data leakage prevention.
"""

import unittest
import pandas as pd
from src.preprocessing import load_raw_dataset, clean_dataset, prepare_priority_dataset, prepare_duration_dataset


class TestPreprocessing(unittest.TestCase):

    def setUp(self):
        self.raw_df = load_raw_dataset()

    def test_dataset_loaded_properly(self):
        self.assertGreater(len(self.raw_df), 7000, "Dataset should have at least 7000 records")
        self.assertEqual(self.raw_df.shape[1], 15, "Raw dataset should contain 15 columns")

    def test_imputation(self):
        cleaned = clean_dataset(self.raw_df)
        self.assertTrue((cleaned["bench_size"] > 0).all(), "Bench size 0 should be imputed to at least 1 or 2")
        self.assertEqual(cleaned["bench_size_imputed"].sum(), (self.raw_df["bench_size"] == 0).sum())

    def test_zero_data_leakage_in_priority(self):
        """CRITICAL: Ensure judgment_date and duration are strictly excluded from Model 1 features."""
        X, y = prepare_priority_dataset(self.raw_df)
        self.assertNotIn("judgment_date", X.columns, "judgment_date must NOT be in priority features")
        self.assertNotIn("case_duration_days_simulated", X.columns, "duration must NOT be in priority features")
        self.assertNotIn("priority_level_simulated", X.columns, "target must NOT be in features")

    def test_zero_data_leakage_in_duration(self):
        """CRITICAL: Ensure judgment_date is strictly excluded from Model 2 features."""
        X, y = prepare_duration_dataset(self.raw_df)
        self.assertNotIn("judgment_date", X.columns, "judgment_date must NOT be in duration features")
        self.assertNotIn("case_duration_days_simulated", X.columns, "duration is target, not feature")


if __name__ == "__main__":
    unittest.main()
