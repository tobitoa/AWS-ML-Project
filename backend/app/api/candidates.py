from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
import pandas as pd
from typing import Optional
from ..models.contracts import CandidatePair, PageResult
from ..services.result_service import load_output, paginated
from ..services.run_service import list_runs

router = APIRouter(prefix="/candidates", tags=["candidates"])

def selected_run(run_id: Optional[str]) -> str:
    if run_id:
        return run_id
    completed = [item for item in list_runs() if item.status == "completed"]
    if not completed:
        raise HTTPException(404, "No completed candidate data is available.")
    return completed[0].run_id

@router.get("", response_model=PageResult[CandidatePair])
def candidates(
    run_id: Optional[str] = None,
    search: str = "",
    source: str = "all",
    country: str = "",
    confidence_min: Optional[float] = Query(default=None, ge=0, le=1),
    status: str = "all",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100)
) -> dict:
    frame = load_output(selected_run(run_id), "candidate_pairs.tsv")
    if search:
        s = search.strip().lower()
        sub_masks = []
        for col in ("source1_entity_id", "source1_business_name", "candidate_entity_id", "candidate_business_name", "candidate_address"):
            if col in frame.columns:
                sub_masks.append(frame[col].astype(str).str.lower().str.contains(s, regex=False))
        if sub_masks:
            comb = sub_masks[0]
            for m in sub_masks[1:]:
                comb = comb | m
            frame = frame[comb]
    if source in {"source2", "source3"}:
        frame = frame[frame.candidate_source == source]
    if country:
        frame = frame[frame.candidate_country.str.casefold() == country.casefold()]
    if confidence_min is not None and isinstance(confidence_min, (int, float)):
        values = pd.to_numeric(frame.score, errors="coerce").fillna(0)
        frame = frame[values >= confidence_min]
    if status == "matched":
        frame = frame[frame.is_match.astype(str).str.lower().isin(["true", "1"])]
    elif status == "unmatched":
        frame = frame[~frame.is_match.astype(str).str.lower().isin(["true", "1"])]
    return paginated(frame, page, page_size)

@router.get("/{source1_entity_id}", response_model=list[CandidatePair])
def candidates_for_entity(source1_entity_id: str, run_id: Optional[str] = None) -> list[dict]:
    frame = load_output(selected_run(run_id), "candidate_pairs.tsv")
    return frame[frame.source1_entity_id == source1_entity_id].to_dict(orient="records")
