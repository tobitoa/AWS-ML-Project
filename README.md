# RESOMESH — Enterprise Business Entity Resolution Platform

RESOMESH is an enterprise business entity resolution and record linkage console powered by the **`aws-main-ml`** machine learning pipeline.

It resolves, links, and validates noisy, unstandardized business records across three disparate data sources (`source1`, `source2`, `source3`) using canonical Unicode normalization, token-sorted inverted index blocking, pairwise feature extraction, and precision-optimized candidate classification.

---

## Architecture

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

## Core Principles & Guarantees

* **Single Authoritative Source**: `aws-main-ml/` is the sole engine for entity resolution, multi-pass blocking, pairwise feature scoring, and validation.
* **Strict Format Compliance**: Outputs strictly adhere to Amazon ML Challenge specifications:
  - `matching_results.tsv`: `source1_entity_id\tmatched_entity_ids` (1:1 preservation of every Source 1 entity; empty string if unmatched; comma-separated for matches with `S2-` and `S3-` prefixes).
  - `candidate_pairs.tsv`: `source1_entity_id\tcandidate_entity_ids`.
* **Zero Fake Metrics**: No synthetic metrics (`0.873`, `20 records`, `214 candidates`) or mock switches exist. All counts and distributions are computed live from actual input data and execution runs.
* **Graceful Offline Degradation**: When the backend service is offline, the frontend presents clean error states with manual retry controls, never displaying misleading synthetic data.
* **Integrated Submission Validator**: Every run is verified against `aws-main-ml/utils/validate_submission.py` to ensure submission safety.

---

## Repository Structure

```text
AWS-project/
├── aws-main-ml/          # Authoritative Entity Resolution ML engine
│   ├── src/              # Normalization, signal-ranked blocking, and model pipelines
│   └── utils/            # validate_submission.py submission auditor
├── backend/              # FastAPI application & REST service layer
│   ├── app/
│   │   ├── api/          # Route handlers (/health, /datasets, /runs, /results, /candidates, /validation)
│   │   ├── ml/           # Adapter linking backend to aws-main-ml
│   │   ├── models/       # Pydantic schema contracts
│   │   └── services/     # Dataset, run, result, and validation services
│   ├── data/             # Local run records, uploads, and TSV outputs
│   ├── tests/            # Comprehensive unit and integration test suite
│   └── requirements.txt  # Python dependencies
├── frontend/             # Next.js 16 Enterprise UI with RESOMESH-Theme
│   ├── app/              # App Router pages (Overview, Upload, Run, Results, QA, Settings)
│   ├── components/       # UI components, layout shell, data tables, filter bars
│   └── lib/              # API client and TypeScript contracts
├── docs/                 # API & architecture specifications
│   ├── aws-main-ml-api.md
│   └── api-integration.md
└── README.md
```

---

## Getting Started

### 1. Backend Setup

```bash
# Activate existing virtual environment or create one
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend server (port 8000)
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend health check:
```bash
curl http://localhost:8000/api/health
```

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start development server (port 3000)
npm run dev

# Or build for production
npm run build
npm start
```

Open `http://localhost:3000` in your browser.

---

## Running Automated Tests

Run the test suite to verify pipeline execution, validator compliance, and API endpoints:

```bash
.venv/bin/python3 -m unittest discover backend/tests
```

All tests run synchronously and verify:
1. `AwsMainMLPipeline.resolve` multi-pass blocking and candidate generation.
2. `matching_results.tsv` and `candidate_pairs.tsv` 1:1 entity coverage and TSV schema compliance.
3. `aws-main-ml/utils/validate_submission.py` validation checks.
4. FastAPI route handlers (`/api/health`, `/api/datasets`, `/api/runs`, `/api/results`, `/api/candidates`, `/api/validation`).

---

## API Documentation

For the complete REST API specification, see [docs/aws-main-ml-api.md](docs/aws-main-ml-api.md).
