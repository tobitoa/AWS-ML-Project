import os
import shutil
import tempfile
import unittest
import pandas as pd
from pathlib import Path

from backend.app.ml.adapter import AwsMainMLPipeline, run_submission_validator
from backend.app.services.validation_service import validate_run
from backend.app.services.dataset_service import inspect_dataset, load_inputs, list_datasets


class TestAwsMainMLPipeline(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.input_dir = os.path.join(self.test_dir, "input")
        self.output_dir = os.path.join(self.test_dir, "output")
        os.makedirs(self.input_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

        # Create realistic test source TSVs conforming to official S1-, S2-, S3- IDs
        self.s1_data = pd.DataFrame([
            {"entity_id": "S1-E101", "business_name": "Starbucks Coffee #104", "business_address": "123 Market St, San Francisco, CA", "country": "US"},
            {"entity_id": "S1-E102", "business_name": "Acme Industrial Supplies", "business_address": "500 Industrial Pkwy, Chicago, IL", "country": "US"},
            {"entity_id": "S1-E103", "business_name": "Target Store T-045", "business_address": "800 Nicollet Mall, Minneapolis, MN", "country": "US"},
            {"entity_id": "S1-E104", "business_name": "Blue Bottle Coffee Co", "business_address": "315 Linden St, San Francisco, CA", "country": "US"},
            {"entity_id": "S1-E105", "business_name": "Unique Enterprise LLC", "business_address": "999 Nowhere Rd, Austin, TX", "country": "US"},
        ])
        self.s2_data = pd.DataFrame([
            {"entity_id": "S2-101", "business_name": "Starbucks Coffee", "business_address": "123 Market Street, San Francisco", "country": "US"},
            {"entity_id": "S2-102", "business_name": "Acme Industrial Supply", "business_address": "500 Industrial Parkway, Chicago", "country": "US"},
            {"entity_id": "S2-103", "business_name": "Target", "business_address": "800 Nicollet Mall, Minneapolis", "country": "US"},
            {"entity_id": "S2-999", "business_name": "Unrelated Bakery", "business_address": "100 Baker St, Boston", "country": "US"},
        ])
        self.s3_data = pd.DataFrame([
            {"entity_id": "S3-101", "business_name": "Starbucks Corp", "business_address": "123 Market St Suite A, SF, CA", "country": "US"},
            {"entity_id": "S3-104", "business_name": "Blue Bottle Coffee", "business_address": "315 Linden Street, San Francisco", "country": "US"},
            {"entity_id": "S3-888", "business_name": "Random Bookshop", "business_address": "42 Main St, Seattle", "country": "US"},
        ])

        self.s1_data.to_csv(os.path.join(self.input_dir, "source1.tsv"), sep="\t", index=False)
        self.s2_data.to_csv(os.path.join(self.input_dir, "source2.tsv"), sep="\t", index=False)
        self.s3_data.to_csv(os.path.join(self.input_dir, "source3.tsv"), sep="\t", index=False)

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_pipeline_execution_and_tsv_outputs(self):
        """Test running AwsMainMLPipeline produces valid TSVs adhering to aws-main-ml specification."""
        pipeline = AwsMainMLPipeline(top_k=20, threshold=0.72)
        pipeline_output = pipeline.resolve(
            self.s1_data,
            self.s2_data,
            self.s3_data,
            output_dir=self.output_dir,
            test_dir=self.input_dir,
        )

        self.assertEqual(pipeline_output.total_records, 5)
        self.assertGreater(pipeline_output.candidate_pairs_count, 0)
        self.assertGreater(pipeline_output.matched_records, 0)
        self.assertTrue(pipeline_output.validation_passed)

        matching_path = os.path.join(self.output_dir, "matching_results.tsv")
        candidate_path = os.path.join(self.output_dir, "candidate_pairs.tsv")

        self.assertTrue(os.path.isfile(matching_path), "matching_results.tsv must exist")
        self.assertTrue(os.path.isfile(candidate_path), "candidate_pairs.tsv must exist")

        # Verify matching_results.tsv format
        matching_df = pd.read_csv(matching_path, sep="\t", dtype=str).fillna("")
        self.assertIn("source1_entity_id", matching_df.columns)
        self.assertIn("matched_entity_ids", matching_df.columns)
        self.assertEqual(len(matching_df), 5, "Every Source 1 entity must be preserved in matching_results.tsv")

        # Verify candidate_pairs.tsv format
        candidate_df = pd.read_csv(candidate_path, sep="\t", dtype=str).fillna("")
        self.assertIn("source1_entity_id", candidate_df.columns)
        self.assertIn("candidate_entity_ids", candidate_df.columns)
        self.assertEqual(len(candidate_df), 5, "Every Source 1 entity must have a row in candidate_pairs.tsv")

        # Verify submission validator from aws-main-ml passes
        errors, warnings = run_submission_validator(
            matching_path,
            candidate_path,
            self.input_dir,
            check_ids=False,
        )
        self.assertEqual(len(errors), 0, f"run_submission_validator found errors: {errors}")

    def test_ground_truth_evaluation(self):
        """Test that when ground truth is supplied, real precision/recall/F0.5 are calculated."""
        # Define known ground truth
        gt = {
            "S1-E101": "S2-101,S3-101",
            "S1-E104": "S3-104",
        }
        pipeline = AwsMainMLPipeline(top_k=20, threshold=0.72)
        pipeline_output = pipeline.resolve(
            self.s1_data,
            self.s2_data,
            self.s3_data,
            output_dir=self.output_dir,
            test_dir=self.input_dir,
            ground_truth=gt,
        )
        self.assertIsNotNone(pipeline_output.f05_score)
        self.assertIsNotNone(pipeline_output.precision)
        self.assertIsNotNone(pipeline_output.recall)
        self.assertGreater(pipeline_output.f05_score, 0.0)

    def test_inspect_dataset(self):
        """Test dataset inspection flags missing columns and invalid schemas."""
        valid_path = Path(self.input_dir) / "source1.tsv"
        info = inspect_dataset("source1", valid_path, "source1.tsv", valid_path.stat().st_size)
        self.assertTrue(info.valid)
        self.assertEqual(info.record_count, 5)

        # Invalid file missing required column
        bad_df = pd.DataFrame([{"wrong_col": "123"}])
        bad_path = Path(self.test_dir) / "bad.tsv"
        bad_df.to_csv(bad_path, sep="\t", index=False)
        bad_info = inspect_dataset("source1", bad_path, "bad.tsv", bad_path.stat().st_size)
        self.assertFalse(bad_info.valid)
        self.assertGreater(len(bad_info.errors), 0)


if __name__ == "__main__":
    unittest.main()
