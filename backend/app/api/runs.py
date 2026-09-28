from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse

from ..models.contracts import PreFlightResponse, RunInfo
from ..services.dataset_service import load_inputs
from ..services.run_service import (
    cancel_run,
    create_run,
    get_run,
    get_run_logs,
    list_runs,
    output_file,
    run_preflight_check,
)
from ..services.validation_service import validate_inputs

router = APIRouter(prefix="/runs", tags=["runs"])

@router.get("/preflight", response_model=PreFlightResponse)
def preflight_check() -> PreFlightResponse:
    return run_preflight_check()

@router.post("", response_model=RunInfo, status_code=202)
def start_run(idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key")) -> RunInfo:
    try:
        clean_key = str(idempotency_key).strip() if isinstance(idempotency_key, str) and idempotency_key.strip() else None
        checks = validate_inputs()
        failures = [f"{item['name']}: {', '.join(item['errors'])}" for item in checks if not item["valid"]]
        if failures:
            raise HTTPException(422, "Input validation failed. " + " ".join(failures))
        load_inputs()
        return create_run(idempotency_key=clean_key)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, str(exc)) from exc

@router.get("", response_model=list[RunInfo])
def runs() -> list[RunInfo]:
    return list_runs()

@router.get("/{run_id}", response_model=RunInfo)
def run_status(run_id: str) -> RunInfo:
    info = get_run(run_id)
    if not info:
        raise HTTPException(404, "Run not found.")
    return info

@router.post("/{run_id}/cancel", response_model=RunInfo)
def cancel_run_endpoint(run_id: str) -> RunInfo:
    info = cancel_run(run_id)
    if not info:
        raise HTTPException(404, "Run not found.")
    return info

@router.get("/{run_id}/logs")
def run_logs(run_id: str) -> dict:
    info = get_run(run_id)
    if not info:
        raise HTTPException(404, "Run not found.")
    logs_text = get_run_logs(run_id)
    return {"run_id": run_id, "logs": logs_text}

@router.get("/{run_id}/download/matching")
def download_matching(run_id: str):
    try:
        path = output_file(run_id, "matching_results.tsv")
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(404, str(exc)) from exc
    return FileResponse(path, filename="matching_results.tsv", media_type="text/tab-separated-values")

@router.get("/{run_id}/download/candidates")
def download_candidates(run_id: str):
    try:
        path = output_file(run_id, "candidate_pairs.tsv")
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(404, str(exc)) from exc
    return FileResponse(path, filename="candidate_pairs.tsv", media_type="text/tab-separated-values")

