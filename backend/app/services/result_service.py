from __future__ import annotations

import json
from pathlib import Path
import pandas as pd
from fastapi import HTTPException
from typing import Optional
from ..config import RUNS_DIR
from .run_service import output_file

def load_output(run_id: str, name: str) -> pd.DataFrame:
    """
    Load results dataframe for API queries.
    Uses detailed JSON cache if available, else falls back to reading the TSV.
    """
    run_dir = RUNS_DIR / run_id
    if name == "matching_results.tsv":
        detail_path = run_dir / "matches_detail.json"
        if detail_path.is_file():
            try:
                data = json.loads(detail_path.read_text(encoding="utf-8"))
                return pd.DataFrame(data)
            except Exception:
                pass
    elif name == "candidate_pairs.tsv":
        detail_path = run_dir / "candidates_detail.json"
        if detail_path.is_file():
            try:
                data = json.loads(detail_path.read_text(encoding="utf-8"))
                return pd.DataFrame(data)
            except Exception:
                pass

    try:
        path = output_file(run_id, name)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(404, str(exc)) from exc
    try:
        frame = pd.read_csv(path, sep="\t", dtype=str, keep_default_na=False)
        # If raw matching TSV is loaded, augment with source1.tsv if possible
        if name == "matching_results.tsv" and "business_name" not in frame.columns:
            s1_path = run_dir / "inputs" / "source1.tsv"
            if s1_path.is_file():
                s1 = pd.read_csv(s1_path, sep="\t", dtype=str, keep_default_na=False)
                frame = pd.merge(s1, frame, left_on="entity_id", right_on="source1_entity_id", how="left")
                frame["source1_entity_id"] = frame["entity_id"]
                frame["status"] = frame["matched_entity_ids"].apply(lambda x: "matched" if x and str(x).strip() else "unmatched")
                frame["confidence"] = frame["status"].apply(lambda s: 0.90 if s == "matched" else 0.0)
                frame["matched_entity_sources"] = "[]"
        return frame
    except Exception as exc:
        raise HTTPException(500, "Could not read generated results.") from exc

def paginated(frame: pd.DataFrame, page: int, page_size: int) -> dict:
    size = min(max(page_size, 1), 100)
    number = max(page, 1)
    start = (number - 1) * size
    items = frame.iloc[start:start + size].to_dict(orient="records")
    for item in items:
        if "matched_entity_ids" in item:
            val = item["matched_entity_ids"]
            if isinstance(val, str):
                try:
                    item["matched_entity_ids"] = json.loads(val or "[]")
                except (TypeError, json.JSONDecodeError):
                    item["matched_entity_ids"] = [x.strip() for x in val.split(",") if x.strip()]
            elif isinstance(val, list):
                item["matched_entity_ids"] = val
            else:
                item["matched_entity_ids"] = []

        if "confidence" in item:
            try:
                item["confidence"] = float(item["confidence"]) if item.get("confidence") is not None and str(item.get("confidence")).strip() != "" else None
            except (ValueError, TypeError):
                item["confidence"] = None

        if "matched_entity_sources" in item:
            s_val = item.get("matched_entity_sources")
            if isinstance(s_val, str):
                try:
                    item["matched_entity_sources"] = json.loads(s_val or "[]")
                except (TypeError, json.JSONDecodeError):
                    item["matched_entity_sources"] = []
            elif isinstance(s_val, list):
                item["matched_entity_sources"] = s_val
            else:
                item["matched_entity_sources"] = []

    return {"items": items, "total": len(frame), "page": number, "page_size": size}

def result_detail(run_id: str, entity_id: str) -> dict:
    frame = load_output(run_id, "matching_results.tsv")
    rows = frame[frame.source1_entity_id == entity_id]
    if rows.empty:
        raise HTTPException(404, "Result not found.")
    candidates = load_output(run_id, "candidate_pairs.tsv")
    related = candidates[candidates.source1_entity_id == entity_id].to_dict(orient="records")
    result = rows.iloc[0].to_dict()
    val = result.get("matched_entity_ids")
    if isinstance(val, str):
        try:
            result["matched_entity_ids"] = json.loads(val or "[]")
        except (TypeError, json.JSONDecodeError):
            result["matched_entity_ids"] = [x.strip() for x in val.split(",") if x.strip()]
    elif not isinstance(val, list):
        result["matched_entity_ids"] = []

    s_val = result.get("matched_entity_sources")
    if isinstance(s_val, str):
        try:
            result["matched_entity_sources"] = json.loads(s_val or "[]")
        except (TypeError, json.JSONDecodeError):
            result["matched_entity_sources"] = []
    elif not isinstance(s_val, list):
        result["matched_entity_sources"] = []

    try:
        result["confidence"] = float(result["confidence"]) if result.get("confidence") is not None and str(result.get("confidence")).strip() != "" else None
    except (ValueError, TypeError):
        result["confidence"] = None

    return {**result, "candidate_count": len(related), "candidates": related}

def filter_results(frame: pd.DataFrame, search: str, status: str, country: str, confidence_min: Optional[float], source: str = "all") -> pd.DataFrame:
    if search:
        mask = frame.astype(str).apply(lambda col: col.str.contains(search, case=False, regex=False)).any(axis=1)
        frame = frame[mask]
    if status in {"matched", "unmatched"}:
        frame = frame[frame.status == status]
    if country:
        frame = frame[frame.country.str.casefold() == country.casefold()]
    if source in {"source2", "source3"}:
        def includes_source(val) -> bool:
            if isinstance(val, list):
                return source in val
            try:
                return source in json.loads(val or "[]")
            except (TypeError, json.JSONDecodeError):
                return False
        frame = frame[frame.matched_entity_sources.map(includes_source)]
    if confidence_min is not None and isinstance(confidence_min, (int, float)):
        values = pd.to_numeric(frame.confidence.replace("", "0"), errors="coerce").fillna(0)
        frame = frame[values >= confidence_min]
    return frame

