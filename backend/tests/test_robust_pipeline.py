import re
import unittest
import uuid
from pathlib import Path
import pandas as pd

from backend.app.config import RUNS_DIR, UPLOADS_DIR
from backend.app.services.dataset_service import (
    source_path,
    validate_raw_bytes,
    sanitize_filename,
)
from backend.app.services.run_service import (
    create_run,
    get_run,
    run_preflight_check,
    check_readiness,
    cancel_run,
    get_run_logs,
    _execute,
)
from backend.app.services.search_service import global_search

class TestRobustPipeline(unittest.TestCase):
    def setUp(self):
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        RUNS_DIR.mkdir(parents=True, exist_ok=True)

        self.s1 = pd.DataFrame([
            {"entity_id": "S1-1", "business_name": "Acme Corp", "business_address": "123 Main St", "country": "US"},
            {"entity_id": "S1-2", "business_name": "Beta LLC", "business_address": "456 Oak Ave", "country": "US"},
        ])
        self.s2 = pd.DataFrame([
            {"entity_id": "S2-1", "business_name": "Acme Corporation", "business_address": "123 Main Street", "country": "US"},
        ])
        self.s3 = pd.DataFrame([
            {"entity_id": "S3-1", "business_name": "Beta Inc", "business_address": "456 Oak Avenue", "country": "US"},
        ])

        self.s1.to_csv(source_path("source1"), sep="\t", index=False)
        self.s2.to_csv(source_path("source2"), sep="\t", index=False)
        self.s3.to_csv(source_path("source3"), sep="\t", index=False)

    def test_sanitize_filename(self):
        self.assertEqual(sanitize_filename("../../etc/passwd"), "passwd")
        self.assertEqual(sanitize_filename("clean_data.tsv"), "clean_data.tsv")
        self.assertEqual(sanitize_filename("my data (1).tsv"), "my_data__1_.tsv")

    def test_validate_raw_bytes(self):
        valid_tsv = b"entity_id\tbusiness_name\tbusiness_address\tcountry\n1\tA\tB\tUS\n"
        delim, text = validate_raw_bytes(valid_tsv, "source1.tsv")
        self.assertEqual(delim, "\t")
        self.assertIn("business_name", text)

        bad_bytes = b"entity_id\tname\n\xff\xfe\x00\x00"
        with self.assertRaises(ValueError):
            validate_raw_bytes(bad_bytes, "source1.tsv")

        with self.assertRaises(ValueError):
            validate_raw_bytes(b"", "source1.tsv")

        comma_in_tsv = b"entity_id,business_name,business_address,country\n1,A,B,US\n"
        with self.assertRaises(ValueError):
            validate_raw_bytes(comma_in_tsv, "source1.tsv")

    def test_preflight_and_readiness_checks(self):
        preflight = run_preflight_check()
        self.assertTrue(preflight.can_run)
        self.assertEqual(len(preflight.sources), 3)
        self.assertEqual(preflight.sources[0].source, "source1")
        self.assertEqual(preflight.sources[0].record_count, 2)
        self.assertEqual(preflight.sources[0].role, "Reference entities")

        readiness = check_readiness()
        self.assertTrue(readiness.ready)
        self.assertTrue(readiness.ml_ready)
        self.assertTrue(readiness.storage_writable)

    def test_run_creation_id_format_and_workspace(self):
        key = f"test-key-{uuid.uuid4().hex[:6]}"
        run = create_run(idempotency_key=key)
        self.assertTrue(bool(re.match(r"^RUN-\d{4}-\d{4}-[A-Za-z0-9]{6}$", run.run_id)))
        self.assertEqual(run.idempotency_key, key)
        self.assertEqual(run.stage, "queued")

        run_dir = RUNS_DIR / run.run_id
        self.assertTrue((run_dir / "input").is_dir())
        self.assertTrue((run_dir / "working").is_dir())
        self.assertTrue((run_dir / "output").is_dir())
        self.assertTrue((run_dir / "logs").is_dir())

        dup_run = create_run(idempotency_key=key)
        self.assertEqual(dup_run.run_id, run.run_id)

    def test_execution_and_logs(self):
        key = f"exec-test-{uuid.uuid4().hex[:6]}"
        run = create_run(idempotency_key=key)
        from backend.app.services.run_service import _futures
        future = _futures.get(run.run_id)
        if future:
            future.result(timeout=15)

        completed_run = get_run(run.run_id)
        self.assertEqual(completed_run.stage, "completed")
        self.assertEqual(completed_run.status, "completed")
        self.assertIsNotNone(completed_run.duration_seconds)

        logs = get_run_logs(run.run_id)
        self.assertIn(f"Initiating execution workspace for {run.run_id}", logs)
        self.assertIn("Successfully processed", logs)

    def test_cancellation(self):
        key = f"cancel-test-{uuid.uuid4().hex[:6]}"
        run = create_run(idempotency_key=key)
        cancelled = cancel_run(run.run_id)
        self.assertEqual(cancelled.stage, "cancelled")
        self.assertEqual(cancelled.status, "cancelled")

    def test_global_search_service(self):
        key = f"search-test-{uuid.uuid4().hex[:6]}"
        run = create_run(idempotency_key=key)
        from backend.app.services.run_service import _futures
        future = _futures.get(run.run_id)
        if future:
            future.result(timeout=15)

        res = global_search(query="Acme", run_id=run.run_id)
        self.assertGreater(res["total_matches"], 0)
        self.assertTrue(any("Acme" in e["title"] for e in res["entities"]))

        ds_res = global_search(query="source1")
        self.assertTrue(any(d["id"] == "source1" for d in ds_res["datasets"]))

