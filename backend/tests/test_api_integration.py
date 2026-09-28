import os
import shutil
import tempfile
import unittest
from pathlib import Path
import pandas as pd

from backend.app.config import RUNS_DIR, UPLOADS_DIR
from backend.app.api.health import health
from backend.app.api.datasets import datasets, input_validation
from backend.app.api.runs import runs, start_run, run_status, download_matching, download_candidates
from backend.app.api.results import results
from backend.app.api.candidates import candidates
from backend.app.api.validation import get_validation
from backend.app.services.dataset_service import source_path
from backend.app.services.run_service import _execute, get_run


class TestApiIntegration(unittest.TestCase):
    def setUp(self):
        # Set up realistic source datasets in UPLOADS_DIR
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        RUNS_DIR.mkdir(parents=True, exist_ok=True)

        self.s1_data = pd.DataFrame([
            {"entity_id": "S1-E101", "business_name": "Starbucks Coffee #104", "business_address": "123 Market St, San Francisco, CA", "country": "US"},
            {"entity_id": "S1-E102", "business_name": "Acme Industrial Supplies", "business_address": "500 Industrial Pkwy, Chicago, IL", "country": "US"},
            {"entity_id": "S1-E103", "business_name": "Target Store T-045", "business_address": "800 Nicollet Mall, Minneapolis, MN", "country": "US"},
        ])
        self.s2_data = pd.DataFrame([
            {"entity_id": "S2-101", "business_name": "Starbucks Coffee", "business_address": "123 Market Street, San Francisco", "country": "US"},
            {"entity_id": "S2-102", "business_name": "Acme Industrial Supply", "business_address": "500 Industrial Parkway, Chicago", "country": "US"},
        ])
        self.s3_data = pd.DataFrame([
            {"entity_id": "S3-101", "business_name": "Starbucks Corp", "business_address": "123 Market St Suite A, SF, CA", "country": "US"},
            {"entity_id": "S3-888", "business_name": "Random Bookshop", "business_address": "42 Main St, Seattle", "country": "US"},
        ])

        self.s1_data.to_csv(source_path("source1"), sep="\t", index=False)
        self.s2_data.to_csv(source_path("source2"), sep="\t", index=False)
        self.s3_data.to_csv(source_path("source3"), sep="\t", index=False)

    def test_health_endpoint(self):
        """Test /api/health returns online status and aws-main-ml model metadata."""
        res = health()
        self.assertTrue(res["ok"])
        self.assertEqual(res["status"], "healthy")
        self.assertIn("aws-main-ml", res["model_name"])
        self.assertEqual(res["model_mode"], "production")

    def test_dataset_listing_and_input_validation(self):
        """Test dataset endpoints inspect uploaded datasets."""
        ds_list = datasets()
        self.assertEqual(len(ds_list), 3)
        for ds in ds_list:
            self.assertTrue(ds.valid)
            self.assertGreater(ds.record_count, 0)

        in_val = input_validation()
        self.assertEqual(len(in_val["checks"]), 3)
        self.assertTrue(all(c["valid"] for c in in_val["checks"]))

    def test_end_to_end_run_execution(self):
        """Test creating a run, running execution, and inspecting results."""
        run_info = start_run()
        # Synchronously execute the run for deterministic testing
        _execute(run_info.run_id)

        completed_run = get_run(run_info.run_id)
        self.assertIsNotNone(completed_run)
        self.assertEqual(completed_run.status, "completed")
        self.assertEqual(completed_run.record_count, 3)
        self.assertGreaterEqual(completed_run.matched_count, 1)

        # Test Results endpoint
        results_page = results(run_id=run_info.run_id, page=1, page_size=10)
        self.assertEqual(results_page["total"], 3)
        self.assertEqual(len(results_page["items"]), 3)

        # Test Candidates endpoint
        candidates_page = candidates(run_id=run_info.run_id, page=1, page_size=10)
        self.assertGreater(candidates_page["total"], 0)

        # Test Validation endpoint
        val_res = get_validation(run_id=run_info.run_id)
        self.assertEqual(val_res["status"], "VALID")
        self.assertTrue(val_res["passed"])
        self.assertEqual(len(val_res["errors"]), 0)

        # Test Downloads
        matching_response = download_matching(run_info.run_id)
        self.assertEqual(matching_response.status_code, 200)
        self.assertEqual(matching_response.filename, "matching_results.tsv")

        # Test Global Search endpoint
        from backend.app.api.search import search
        search_res = search(q="Starbucks", run_id=run_info.run_id)
        self.assertGreater(search_res["total_matches"], 0)
        self.assertTrue(any("Starbucks" in e["title"] for e in search_res["entities"]))

        search_run = search(q=run_info.run_id)
        self.assertTrue(any(r["id"] == run_info.run_id for r in search_run["runs"]))


if __name__ == "__main__":
    unittest.main()
