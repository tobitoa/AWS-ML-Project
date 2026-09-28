# RESOMESH API Integration Specification

This document details the HTTP REST API contract exposed by the backend services and consumed by the RESOMESH frontend application, backed by the `aws-main-ml` Business Entity Resolution pipeline.

## Base URL
* Development / Default: `http://localhost:8000/api`
* Configured in frontend via: `NEXT_PUBLIC_API_URL`

---

## 1. System Health

### `GET /api/health`
* **Purpose**: Verify backend connectivity and ascertain resolver model status.
* **Request**: None.
* **Response** (`200 OK`):
  ```json
  {
    "ok": true,
    "status": "healthy",
    "model_name": "aws-main-ml Entity Resolution Pipeline",
    "model_mode": "production"
  }
  ```
* **Frontend Health States**:
  - `Backend Online` & `ML Service Ready` (`ok: true`)
  - `Backend Offline` / `ML Service Unavailable` (Network timeout, connection refused, or HTTP 5xx)
* **Error Cases**:
  - `503 Service Unavailable`: ML resolver failed initialization.

---

## 2. Dataset Management

### `GET /api/datasets`
* **Purpose**: Retrieve metadata for uploaded datasets across Source 1, Source 2, and Source 3.
* **Request**: None.
* **Response** (`200 OK`):
  ```json
  [
    {
      "dataset_id": "source1",
      "source": "source1",
      "filename": "source1.tsv",
      "size_bytes": 1420,
      "record_count": 20,
      "valid": true,
      "errors": [],
      "columns": ["entity_id", "business_name", "business_address", "country"]
    }
  ]
  ```

### `POST /api/datasets/upload?source={source1|source2|source3}`
* **Purpose**: Upload a tab-separated (`.tsv`) or comma-separated (`.csv`) dataset for a specific source.
* **Request**: `multipart/form-data` with `file: Binary`. Query parameter `source` must be one of `source1`, `source2`, `source3`.
* **Response** (`200 OK`): `DatasetInfo` object.
* **Error Cases**:
  - `400 Bad Request`: File is empty, exceeds 100MB (`MAX_UPLOAD_BYTES`), or lacks required headers (`entity_id`, `business_name`, `business_address`, `country`).
  - `422 Unprocessable Entity`: Invalid source identifier.

### `POST /api/datasets/demo`
* **Purpose**: Load built-in realistic demo datasets for Source 1, Source 2, and Source 3.
* **Request**: None.
* **Response** (`200 OK`): Array of `DatasetInfo` objects.

### `DELETE /api/datasets/{dataset_id}`
* **Purpose**: Remove an uploaded dataset and its metadata.
* **Request**: Path parameter `dataset_id` (e.g. `source1`).
* **Response** (`200 OK`):
  ```json
  {
    "deleted": "source1"
  }
  ```

### `GET /api/datasets/validation`
* **Purpose**: Pre-run validation checking if all 3 sources are uploaded, valid, and contain required columns.
* **Request**: None.
* **Response** (`200 OK`):
  ```json
  {
    "status": "VALID",
    "checks": [
      {
        "name": "source1",
        "valid": true,
        "rows": 20,
        "errors": []
      }
    ]
  }
  ```

---

## 3. Matching Runs & Execution

### `POST /api/runs`
* **Purpose**: Trigger a background entity resolution run across currently loaded datasets.
* **Request**: None.
* **Response** (`202 Accepted`):
  ```json
  {
    "run_id": "run_95c3dfebb3",
    "status": "queued",
    "model": "ResoMesh Demo Resolver",
    "mode": "demo",
    "created_at": "2026-09-26T09:00:29.927432Z",
    "started_at": null,
    "completed_at": null,
    "error": null,
    "records_processed": null,
    "record_count": null,
    "matched_count": null,
    "unmatched_count": null,
    "candidate_count": null
  }
  ```
* **Error Cases**:
  - `422 Unprocessable Entity`: Input validation failed (one or more sources missing or invalid).

### `GET /api/runs`
* **Purpose**: List historical and active matching runs sorted by creation timestamp descending.
* **Request**: None.
* **Response** (`200 OK`): Array of `RunInfo` objects.

### `GET /api/runs/{run_id}`
* **Purpose**: Retrieve status and summary statistics for an individual run.
* **Request**: Path parameter `run_id`.
* **Response** (`200 OK`): `RunInfo` object.
* **Error Cases**:
  - `404 Not Found`: Run does not exist.

### `GET /api/runs/{run_id}/download/matching`
* **Purpose**: Stream backend-generated `matching_results.tsv` file.
* **Response** (`200 OK`): Content-Type `text/tab-separated-values`.
* **Error Cases**:
  - `404 Not Found`: Run not found or output file missing.

### `GET /api/runs/{run_id}/download/candidates`
* **Purpose**: Stream backend-generated `candidate_pairs.tsv` file.
* **Response** (`200 OK`): Content-Type `text/tab-separated-values`.
* **Error Cases**:
  - `404 Not Found`: Run not found or output file missing.

---

## 4. Results & Candidates

### `GET /api/results`
* **Purpose**: Paginated search and filtering over resolved entities.
* **Query Parameters**:
  - `run_id` (optional): Defaults to latest completed run.
  - `search` (optional): Substring filter over entity ID, business name, address.
  - `status` (`all` | `matched` | `unmatched`).
  - `source` (`all` | `source2` | `source3`).
  - `country` (optional): Case-insensitive country match.
  - `confidence_min` (optional, float `0.0` - `1.0`): Minimum match confidence.
  - `page` (default: 1): Page number.
  - `page_size` (default: 20, max: 100): Records per page.
* **Response** (`200 OK`):
  ```json
  {
    "items": [
      {
        "source1_entity_id": "S1-004821",
        "business_name": "Northstar Coffee Roasters",
        "business_address": "18 Park Street, Kolkata, West Bengal",
        "country": "India",
        "matched_entity_ids": ["S2-118204", "S3-091442"],
        "matched_entity_sources": ["source2", "source3"],
        "confidence": 0.96,
        "status": "matched"
      }
    ],
    "total": 20,
    "page": 1,
    "page_size": 20
  }
  ```

### `GET /api/results/{source1_entity_id}`
* **Purpose**: Detailed inspection of a specific Source 1 entity and all its candidate associations.
* **Query Parameters**: `run_id` (optional).
* **Response** (`200 OK`):
  ```json
  {
    "source1_entity_id": "S1-004821",
    "business_name": "Northstar Coffee Roasters",
    "business_address": "18 Park Street, Kolkata, West Bengal",
    "country": "India",
    "matched_entity_ids": ["S2-118204", "S3-091442"],
    "matched_entity_sources": ["source2", "source3"],
    "confidence": 0.96,
    "status": "matched",
    "candidate_count": 4,
    "candidates": [ ... ]
  }
  ```

### `GET /api/candidates`
* **Purpose**: Paginated search and filtering over all pairwise candidate pairs.
* **Query Parameters**:
  - `run_id` (optional): Defaults to latest completed run.
  - `search` (optional): Substring search across entity IDs and business names.
  - `source` (`all` | `source2` | `source3`).
  - `country` (optional): Case-insensitive filter.
  - `confidence_min` (optional, float `0.0` - `1.0`).
  - `status` (`all` | `matched` | `unmatched`).
  - `page` (default: 1), `page_size` (default: 20, max: 100).
* **Response** (`200 OK`): `PageResult<CandidatePair>`.

### `GET /api/candidates/{source1_entity_id}`
* **Purpose**: Fetch all candidate pairs for a given Source 1 entity.
* **Response** (`200 OK`): Array of `CandidatePair` objects.

---

## 5. Post-Run Validation

### `POST /api/validation/{run_id}` & `GET /api/validation/{run_id}`
* **Purpose**: Validate dataset integrity, output file accessibility, and full 1:1 coverage of Source 1 entities.
* **Response** (`200 OK`):
  ```json
  {
    "run_id": "run_95c3dfebb3",
    "status": "VALID",
    "checks": [
      {
        "name": "source1 input",
        "valid": true,
        "rows": 20,
        "errors": []
      },
      {
        "name": "matching_results.tsv",
        "valid": true,
        "rows": 20,
        "errors": []
      },
      {
        "name": "candidate_pairs.tsv",
        "valid": true,
        "rows": 214,
        "errors": []
      },
      {
        "name": "Source 1 record coverage",
        "valid": true,
        "rows": 20,
        "errors": []
      }
    ],
    "errors": []
  }
  ```
