from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd

from ..config import RUNS_DIR
from .dataset_service import list_datasets
from .run_service import list_runs
from .result_service import load_output

def global_search(query: str, run_id: Optional[str] = None, limit: int = 6) -> Dict[str, Any]:
    q = (query or "").strip().casefold()
    if not q:
        return {
            "query": "",
            "entities": [],
            "runs": [],
            "candidates": [],
            "datasets": [],
            "total_matches": 0,
        }

    results: Dict[str, Any] = {
        "query": query,
        "entities": [],
        "runs": [],
        "candidates": [],
        "datasets": [],
        "total_matches": 0,
    }

    # 1. Search Datasets
    try:
        datasets = list_datasets()
        for ds in datasets:
            haystack = f"{ds.source} {ds.filename} {' '.join(ds.columns)}".casefold()
            if q in haystack:
                results["datasets"].append({
                    "id": ds.source,
                    "title": ds.filename,
                    "subtitle": f"{ds.source.upper()} · {ds.record_count or 0} rows · {'Valid' if ds.valid else 'Issues'}",
                    "valid": ds.valid,
                    "href": "/upload",
                })
                if len(results["datasets"]) >= limit:
                    break
    except Exception:
        pass

    # 2. Search Runs
    all_runs = list_runs()
    selected_run = None

    if run_id:
        selected_run = next((r for r in all_runs if r.run_id == run_id), None)
    if not selected_run:
        selected_run = next((r for r in all_runs if r.status == "completed"), None) or (all_runs[0] if all_runs else None)

    for r in all_runs:
        haystack = f"{r.run_id} {r.model} {r.mode} {r.status} {getattr(r, 'idempotency_key', '')}".casefold()
        if q in haystack:
            results["runs"].append({
                "id": r.run_id,
                "title": r.run_id,
                "subtitle": f"{r.status.upper()} · {r.record_count or r.records_processed or '—'} records · {r.matched_count or 0} matches",
                "status": r.status,
                "href": f"/results?run_id={r.run_id}",
            })
            if len(results["runs"]) >= limit:
                break

    # 3. Search Entities & Candidates within active/selected run
    target_run_id = selected_run.run_id if selected_run else None
    if target_run_id:
        # Search Entities
        try:
            m_frame = load_output(target_run_id, "matching_results.tsv")
            if not m_frame.empty:
                # Text columns to check
                text_cols = [c for c in ("source1_entity_id", "entity_id", "business_name", "business_address", "country") if c in m_frame.columns]
                
                # Check text columns
                mask = m_frame[text_cols].astype(str).apply(lambda col: col.str.contains(q, case=False, regex=False)).any(axis=1)
                
                # Check matched_entity_ids if present
                if "matched_entity_ids" in m_frame.columns:
                    def match_ids(val: Any) -> bool:
                        if isinstance(val, (list, tuple)):
                            return any(q in str(x).casefold() for x in val)
                        return q in str(val).casefold()
                    mask = mask | m_frame["matched_entity_ids"].apply(match_ids)

                matching_rows = m_frame[mask].head(limit)

                for _, row in matching_rows.iterrows():
                    eid = row.get("source1_entity_id") or row.get("entity_id", "")
                    bname = row.get("business_name") or eid
                    baddr = row.get("business_address", "")
                    bcountry = row.get("country", "")
                    status = row.get("status", "unmatched")
                    conf = row.get("confidence")
                    try:
                        conf_val = float(conf) if conf is not None and str(conf).strip() != "" else None
                    except (ValueError, TypeError):
                        conf_val = None

                    results["entities"].append({
                        "id": eid,
                        "title": bname,
                        "subtitle": f"{eid} · {baddr} {bcountry}".strip(),
                        "status": status,
                        "match_status": status,
                        "confidence": conf_val,
                        "href": f"/results?search={eid}&run_id={target_run_id}",
                    })
        except Exception:
            pass

        # Search Candidates
        try:
            c_frame = load_output(target_run_id, "candidate_pairs.tsv")
            if not c_frame.empty:
                c_cols = [c for c in ("candidate_entity_id", "candidate_business_name", "candidate_address", "source1_entity_id", "source1_business_name") if c in c_frame.columns]
                c_mask = c_frame[c_cols].astype(str).apply(lambda col: col.str.contains(q, case=False, regex=False)).any(axis=1)
                matching_cands = c_frame[c_mask].head(limit)

                for _, row in matching_cands.iterrows():
                    cid = row.get("candidate_entity_id", "")
                    cname = row.get("candidate_business_name") or cid
                    caddr = row.get("candidate_address", "")
                    s1_id = row.get("source1_entity_id", "")
                    source = row.get("candidate_source", "")
                    score = row.get("score")
                    try:
                        score_val = float(score) if score is not None and str(score).strip() != "" else None
                    except (ValueError, TypeError):
                        score_val = None

                    results["candidates"].append({
                        "id": cid,
                        "s1_id": s1_id,
                        "title": cname,
                        "subtitle": f"{cid} ({source.upper()}) → {s1_id} · {caddr}".strip(),
                        "score": score_val,
                        "source": source,
                        "href": f"/candidates?search={cid}&run_id={target_run_id}",
                    })
        except Exception:
            pass

    results["total_matches"] = (
        len(results["entities"]) + len(results["runs"]) + len(results["candidates"]) + len(results["datasets"])
    )
    return results
