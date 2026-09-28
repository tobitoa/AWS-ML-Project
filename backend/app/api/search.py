from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Query
from ..services.search_service import global_search

router = APIRouter(prefix="/search", tags=["search"])

@router.get("")
def search(
    q: str = Query(default="", description="Search query string"),
    run_id: Optional[str] = Query(default=None, description="Optional Run ID to search within"),
    limit: int = Query(default=6, ge=1, le=20, description="Max results per category"),
) -> dict:
    clean_q = str(q) if isinstance(q, str) else ""
    clean_run_id = str(run_id) if isinstance(run_id, str) and run_id.strip() else None
    clean_limit = int(limit) if isinstance(limit, (int, float)) else 6
    return global_search(query=clean_q, run_id=clean_run_id, limit=clean_limit)
