from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..models.contracts import MatchResult, PageResult
from ..services.result_service import filter_results, load_output, paginated, result_detail
from ..services.run_service import list_runs

router = APIRouter(prefix="/results", tags=["results"])

def default_run_id(run_id: Optional[str]) -> str:
    if run_id:
        return run_id
    completed = [item for item in list_runs() if item.status == "completed"]
    if not completed:
        raise HTTPException(404, "No completed results are available.")
    return completed[0].run_id

@router.get("", response_model=PageResult[MatchResult])
def results(run_id: Optional[str] = None, search: str = "", status: str = "all", source: str = "all", country: str = "", confidence_min: Optional[float] = Query(default=None, ge=0, le=1), page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100)) -> dict:
    frame = load_output(default_run_id(run_id), "matching_results.tsv")
    filtered = filter_results(frame, search, status.lower(), country, confidence_min, source)
    return paginated(filtered, page, page_size)

@router.get("/{source1_entity_id}")
def result_detail_endpoint(source1_entity_id: str, run_id: Optional[str] = None) -> dict:
    return result_detail(default_run_id(run_id), source1_entity_id)
