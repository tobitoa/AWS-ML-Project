# aws-main-ml API & Integration Reference

This document provides the complete API specification for the **RESOMESH** backend integrated with the **`aws-main-ml`** Business Entity Resolution engine.

`aws-main-ml` is the single source of truth for:
* Multi-pass inverted index blocking (`normalization.py`, `signal_ranked_blocking.py`)
* Feature extraction and pairwise candidate scoring (`model_pipeline.py`)
* Strict submission artifact generation (`matching_results.tsv`, `candidate_pairs.tsv`)
* Official submission compliance auditing (`utils/validate_submission.py`)

---

## Architecture Flow

```text
┌────────────────────────────────────────────────────────┐
│               RESOMESH Frontend (Next.js)             │
│   (App Shell, Overview, Upload, Run, Results, QA)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST (port 8000)
┌───────────────────────────▼────────────────────────────┐
│              FastAPI Application API Layer             │
│   (/api/health, /api/datasets, /api/runs, /api/...)    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│           backend.app.ml.adapter.AwsMainMLPipeline     │
│   (Bridges FastAPI requests to aws-main-ml engine)     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  aws-main-ml ML Engine                 │
│   ├── src/normalization.py                             │
│   ├── src/signal_ranked_blocking.py                    │
│   ├── src/model_pipeline.py                            │
│   └── utils/validate_submission.py                     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│               Generated Output TSV Artifacts           │
│   ├── matching_results.tsv (scored on leaderboard)     │
│   ├── candidate_pairs.tsv (blocking candidates)        │
│   ├── matches_detail.json (UI rich inspection)         │
│   └── candidates_detail.json (pairwise signals)        │
└────────────────────────────────────────────────────────┘
```

---

## Base Endpoints

All endpoints are hosted at `http://localhost:8000/api` (or customized via `NEXT_PUBLIC_API_URL`).

### 1. System Health & Engine Telemetry

#### `GET /api/health`
Verifies backend connectivity and reports the detected `aws-main-ml` engine.

**Response (`200 OK`)**:
```json
{
  "ok": true,
  "status": "healthy",
  "model_name": "aws-main-ml Entity Resolution Pipeline",
  "model_mode": "production"
}
```

---

### 2. Dataset Management

#### `GET /api/datasets`
Lists current status and schema validation for the three required input sources (`source1`, `source2`, `source3`).

**Response (`200 OK`)**:
```json
[
  {
    "dataset_id": "source1",
    "source": "source1",
    "filename": "source1.tsv",
    "size_bytes": 1048576,
    "record_count": 10000,
    "valid": true,
    "errors": [],
    "columns": ["entity_id", "business_name", "business_address", "country"]
  }
]
```

#### `POST /api/datasets/upload?source={source1|source2|source3}`
Uploads and validates a `.tsv` or `.csv` dataset for the specified source.

* **Headers**: `multipart/form-data`
* **Form Field**: `file: Binary`
* **Required Columns**: `entity_id`, `business_name`, `business_address`, `country`
* **Response (`200 OK`)**: `DatasetInfo`

#### `GET /api/datasets/validation`
Performs pre-flight checks on all three sources to ensure readiness before execution.

**Response (`200 OK`)**:
```json
{
  "status": "VALID",
  "checks": [
    { "name": "source1", "valid": true, "rows": 10000, "errors": [] },
    { "name": "source2", "valid": true, "rows": 12000, "errors": [] },
    { "name": "source3", "valid": true, "rows": 11500, "errors": [] }
  ]
}
```

#### `DELETE /api/datasets/{dataset_id}`
Deletes uploaded dataset file and metadata cache.

---

### 3. Pipeline Execution

#### `POST /api/runs`
Queues a background entity resolution run using `aws-main-ml`.

**Response (`202 Accepted`)**:
```json
{
  "run_id": "run_a1b2c3d4e5",
  "status": "queued",
  "model": "aws-main-ml Entity Resolution Pipeline",
  "mode": "production",
  "created_at": "2026-09-28T18:30:00Z"
}
```

#### `GET /api/runs`
Returns all execution runs sorted by creation date descending.

#### `GET /api/runs/{run_id}`
Returns status and telemetry for a specific run.

**Response (`200 OK`)**:
```json
{
  "run_id": "run_a1b2c3d4e5",
  "status": "completed",
  "model": "aws-main-ml Entity Resolution Pipeline",
  "mode": "production",
  "created_at": "2026-09-28T18:30:00Z",
  "started_at": "2026-09-28T18:30:01Z",
  "completed_at": "2026-09-28T18:30:45Z",
  "record_count": 10000,
  "records_processed": 10000,
  "matched_count": 8420,
  "unmatched_count": 1580,
  "candidate_count": 48200
}
```

---

### 4. Artifact Downloads

#### `GET /api/runs/{run_id}/download/matching`
Downloads the official leaderboard submission file `matching_results.tsv`.
* **Content-Type**: `text/tab-separated-values`
* **Header**: `source1_entity_id\tmatched_entity_ids`
* **Guarantees**: Exactly one line per Source 1 entity (1:1 preservation). Empty string for unmatched entities. Comma-separated for matches.

#### `GET /api/runs/{run_id}/download/candidates`
Downloads the candidate pairs file `candidate_pairs.tsv`.
* **Content-Type**: `text/tab-separated-values`
* **Header**: `source1_entity_id\tcandidate_entity_ids`

---

### 5. Results & Candidate Exploration

#### `GET /api/results`
Query parameters:
* `run_id`: Execution ID (optional; defaults to most recent completed run)
* `search`: Business name, address, or entity ID substring
* `status`: `all` | `matched` | `unmatched`
* `source`: `all` | `source2` | `source3`
* `country`: Country code filter
* `confidence_min`: Float between 0.0 and 1.0
* `page`: Integer page number (1-indexed)
* `page_size`: Page size (default 20, max 100)

**Response (`200 OK`)**: `PageResult[MatchResult]`

#### `GET /api/candidates`
Query parameters:
* `run_id`, `search`, `source`, `country`, `confidence_min`, `status`, `page`, `page_size`

**Response (`200 OK`)**: `PageResult[CandidatePair]`

---

### 6. Official Validation & Quality Assurance

#### `GET /api/validation/{run_id}`
Executes `aws-main-ml/utils/validate_submission.py` against the generated output files and validates 1:1 Source 1 entity preservation.

**Response (`200 OK`)**:
```json
{
  "run_id": "run_a1b2c3d4e5",
  "status": "VALID",
  "passed": true,
  "checks": [
    { "name": "source1 input", "valid": true, "rows": 10000, "errors": [] },
    { "name": "matching_results.tsv schema", "valid": true, "rows": 10000, "errors": [] },
    { "name": "candidate_pairs.tsv schema", "valid": true, "rows": 10000, "errors": [] },
    { "name": "Source 1 record coverage", "valid": true, "rows": 10000, "errors": [] }
  ],
  "errors": [],
  "warnings": [],
  "f05": null,
  "precision": null,
  "recall": null,
  "coverage": 1.0,
  "rows_validated": 10000
}
```
*Note*: `f05`, `precision`, and `recall` are evaluated dynamically only if a ground truth TSV (`train_ground_truth.tsv` or `ground_truth.tsv`) is provided. Unlabeled test sets return `null`, preventing synthetic score inflation.
