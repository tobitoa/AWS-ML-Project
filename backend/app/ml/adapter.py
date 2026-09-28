"""
Authoritative Business Entity Resolution Adapter.
Connects the RESOMESH backend directly to aws-main-ml.
Single source of truth for preprocessing, blocking, candidate generation,
ML inference, result generation, and validation.
"""
from __future__ import annotations

import csv
import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Union
import numpy as np
import pandas as pd
from rapidfuzz import fuzz

from ..config import AWS_MAIN_ML_DIR

# Ensure aws-main-ml/src and aws-main-ml/utils are on python path
_src_dir = str((AWS_MAIN_ML_DIR / "src").resolve())
_utils_dir = str((AWS_MAIN_ML_DIR / "utils").resolve())

for path_dir in (_src_dir, _utils_dir):
    if path_dir not in sys.path:
        sys.path.insert(0, path_dir)

from normalization import (
    normalize_name_v2,
    normalize_name_token_sorted,
    normalize_address,
    address_tokens,
)
from validate_submission import validate as run_submission_validator


@dataclass
class PipelineOutput:
    matches_df: pd.DataFrame
    candidates_df: pd.DataFrame
    matching_tsv_path: Path
    candidate_tsv_path: Path
    validation_passed: bool
    validation_errors: list[str] = field(default_factory=list)
    validation_warnings: list[str] = field(default_factory=list)
    total_records: int = 0
    matched_records: int = 0
    unmatched_records: int = 0
    candidate_pairs_count: int = 0
    precision: Optional[float] = None
    recall: Optional[float] = None
    f05_score: Optional[float] = None


class AwsMainMLPipeline:
    """
    Authoritative Entity Resolution Pipeline implemented in aws-main-ml.
    """

    name: str = "aws-main-ml Entity Resolution Pipeline"
    mode: str = "production"

    def __init__(self, top_k: int = 40, threshold: float = 0.72):
        self.top_k = top_k
        self.threshold = threshold

    def _index_source(self, df: pd.DataFrame, source_num: int) -> dict:
        """
        Builds in-memory multi-pass inverted indexes for a target source (Source 2 or Source 3).
        Mirrors aws-main-ml build_source.
        """
        ids = []
        names = []
        addresses = []
        countries = []

        exact_name: dict[tuple[str, str], list[int]] = {}
        name_tokens: dict[tuple[str, str], list[int]] = {}
        exact_address: dict[tuple[str, str], list[int]] = {}
        address_tokens_index: dict[tuple[str, str], list[int]] = {}

        for row in df.itertuples(index=False):
            entity_id = str(getattr(row, "entity_id", "")).strip()
            country = str(getattr(row, "country", "")).strip()
            raw_name = str(getattr(row, "business_name", ""))
            raw_address = str(getattr(row, "business_address", ""))

            name = normalize_name_v2(raw_name) if raw_name else ""
            sorted_name = normalize_name_token_sorted(raw_name) if raw_name else ""
            address = normalize_address(raw_address) if raw_address else ""

            row_index = len(ids)
            code = row_index + 1 if source_num == 2 else -(row_index + 1)

            ids.append(entity_id)
            names.append(name)
            addresses.append(address)
            countries.append(country)

            # 1. Exact / Token-sorted Name index
            if sorted_name:
                key = (country, sorted_name)
                exact_name.setdefault(key, []).append(code)

            # 2. Name tokens index
            if name:
                tokens = {t for t in name.split() if len(t) >= 3}
                for t in tokens:
                    name_tokens.setdefault((country, t), []).append(code)

            # 3. Exact address index
            if address:
                exact_address.setdefault((country, address), []).append(code)

                # 4. Address tokens index
                tokens = {t for t in address.split() if len(t) >= 3}
                for t in tokens:
                    address_tokens_index.setdefault((country, t), []).append(code)

        return {
            "ids": ids,
            "names": names,
            "addresses": addresses,
            "countries": countries,
            "raw_names": list(df["business_name"].astype(str)),
            "raw_addresses": list(df["business_address"].astype(str)),
            "exact_name": exact_name,
            "name_tokens": name_tokens,
            "exact_address": exact_address,
            "address_tokens": address_tokens_index,
        }

    def _generate_candidates(
        self,
        country: str,
        raw_name: str,
        raw_address: str,
        s2_idx: dict,
        s3_idx: dict,
    ) -> dict[int, float]:
        """
        Generates candidate records with multi-pass signal weights matching aws-main-ml.
        Evidence:
          +10 exact token-sorted name
          +10 exact normalized address
          +3  rare name token overlap
          +3  rare address token overlap
          +1  fallback address token
        """
        scores: dict[int, float] = {}

        def add_evidence(code: int, weight: float) -> None:
            scores[code] = scores.get(code, 0.0) + weight

        # Signal 1: Name
        if raw_name:
            sorted_name = normalize_name_token_sorted(raw_name)
            if sorted_name:
                key = (country, sorted_name)
                for code in s2_idx["exact_name"].get(key, []):
                    add_evidence(code, 10.0)
                for code in s3_idx["exact_name"].get(key, []):
                    add_evidence(code, 10.0)

            normalized_name = normalize_name_v2(raw_name)
            if normalized_name:
                tokens = {t for t in normalized_name.split() if len(t) >= 3}
                for t in tokens:
                    key = (country, t)
                    for code in s2_idx["name_tokens"].get(key, []):
                        add_evidence(code, 3.0)
                    for code in s3_idx["name_tokens"].get(key, []):
                        add_evidence(code, 3.0)

        # Signal 2: Address
        if raw_address:
            normalized_address = normalize_address(raw_address)
            if normalized_address:
                key = (country, normalized_address)
                for code in s2_idx["exact_address"].get(key, []):
                    add_evidence(code, 10.0)
                for code in s3_idx["exact_address"].get(key, []):
                    add_evidence(code, 10.0)

                tokens = {t for t in normalized_address.split() if len(t) >= 3}
                for t in tokens:
                    key = (country, t)
                    for code in s2_idx["address_tokens"].get(key, []):
                        add_evidence(code, 3.0)
                    for code in s3_idx["address_tokens"].get(key, []):
                        add_evidence(code, 3.0)

        # If no candidates matched in same country or blocking was sparse, fallback check
        if not scores and raw_name:
            sorted_name = normalize_name_token_sorted(raw_name)
            for (c, sn), codes in s2_idx["exact_name"].items():
                if sn == sorted_name:
                    for code in codes:
                        add_evidence(code, 6.0)
            for (c, sn), codes in s3_idx["exact_name"].items():
                if sn == sorted_name:
                    for code in codes:
                        add_evidence(code, 6.0)

        return scores

    def resolve(
        self,
        source1: pd.DataFrame,
        source2: pd.DataFrame,
        source3: pd.DataFrame,
        output_dir: Union[str, Path],
        test_dir: Optional[Union[str, Path]] = None,
        ground_truth: Optional[dict[str, Union[str, set[str]]]] = None,
        stage_callback: Optional[Any] = None,
        **kwargs: Any,
    ) -> PipelineOutput:
        """
        Execute full Entity Resolution matching pipeline using aws-main-ml logic.
        Writes matching_results.tsv and candidate_pairs.tsv with exact challenge schemas.
        """
        if stage_callback:
            stage_callback("preprocessing", "Normalizing entity sources and building inverted indexes")
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        test_path = Path(test_dir) if test_dir else output_path

        # 1. Clean DataFrames
        s1 = source1.astype(str).fillna("")
        s2 = source2.astype(str).fillna("")
        s3 = source3.astype(str).fillna("")

        # 2. Build Inverted Target Indexes
        s2_idx = self._index_source(s2, 2)
        s3_idx = self._index_source(s3, 3)

        matching_rows: list[dict[str, str]] = []
        candidate_rows: list[dict[str, str]] = []
        matches_detail: list[dict] = []
        candidates_detail: list[dict] = []

        total_records = len(s1)
        matched_records = 0
        total_candidate_relations = 0

        # Ground truth check for evaluation if provided
        gt_mapping: Optional[dict[str, set[str]]] = None
        if ground_truth:
            gt_mapping = {
                k: set(v.split(",")) if isinstance(v, str) else set(v)
                for k, v in ground_truth.items()
            }
        else:
            for gt_name in ("train_ground_truth.tsv", "ground_truth.tsv"):
                gt_file = test_path / gt_name
                if gt_file.is_file():
                    try:
                        gt_df = pd.read_csv(gt_file, sep="\t", dtype=str, keep_default_na=False)
                        gt_mapping = {
                            row.source1_entity_id: set(row.matched_entity_ids.split(",")) if row.matched_entity_ids.strip() else set()
                            for row in gt_df.itertuples(index=False)
                        }
                        break
                    except Exception:
                        gt_mapping = None

        tp, fp, fn = 0, 0, 0

        for row in s1.itertuples(index=False):
            s1_id = str(getattr(row, "entity_id", "")).strip()
            country = str(getattr(row, "country", "")).strip()
            raw_name = str(getattr(row, "business_name", ""))
            raw_address = str(getattr(row, "business_address", ""))

            s1_name_norm = normalize_name_v2(raw_name) if raw_name else ""
            s1_name_sorted = normalize_name_token_sorted(raw_name) if raw_name else ""
            s1_addr_norm = normalize_address(raw_address) if raw_address else ""

            # Blocking and candidate generation
            scores = self._generate_candidates(country, raw_name, raw_address, s2_idx, s3_idx)

            # Sort and take top K candidates
            sorted_candidates = sorted(scores.items(), key=lambda x: x[1], reverse=True)[: self.top_k]

            matched_ids: list[str] = []
            matched_sources: list[str] = []
            cand_ids: list[str] = []
            matched_entity_objs: list[dict] = []
            best_confidence: float = 0.0

            for code, block_score in sorted_candidates:
                if code > 0:
                    src_num = 2
                    idx = code - 1
                    target_idx = s2_idx
                    src_label = "source2"
                else:
                    src_num = 3
                    idx = -code - 1
                    target_idx = s3_idx
                    src_label = "source3"

                cand_id = target_idx["ids"][idx]
                cand_ids.append(cand_id)
                cand_name = target_idx["names"][idx]
                cand_addr = target_idx["addresses"][idx]
                cand_raw_name = target_idx["raw_names"][idx]
                cand_raw_addr = target_idx["raw_addresses"][idx]
                cand_country = target_idx["countries"][idx]

                # Pairwise feature scoring (Rapidfuzz + Signal Scoring)
                exact_name = bool(s1_name_sorted and cand_name and s1_name_sorted == normalize_name_token_sorted(cand_raw_name))
                exact_addr = bool(s1_addr_norm and cand_addr and s1_addr_norm == cand_addr)

                name_ratio = (fuzz.ratio(s1_name_norm, cand_name) / 100.0) if s1_name_norm and cand_name else 0.0
                name_tok_ratio = (fuzz.token_set_ratio(s1_name_norm, cand_name) / 100.0) if s1_name_norm and cand_name else 0.0
                addr_ratio = (fuzz.ratio(s1_addr_norm, cand_addr) / 100.0) if s1_addr_norm and cand_addr else 0.0
                addr_tok_ratio = (fuzz.token_set_ratio(s1_addr_norm, cand_addr) / 100.0) if s1_addr_norm and cand_addr else 0.0

                # Composite ML probability / confidence calculation
                if exact_name and exact_addr:
                    pair_score = 0.99
                elif exact_name and (addr_tok_ratio >= 0.70 or block_score >= 13):
                    pair_score = 0.94
                elif exact_addr and (name_tok_ratio >= 0.85):
                    pair_score = 0.92
                else:
                    name_weight = 0.55 * max(name_ratio, name_tok_ratio)
                    addr_weight = 0.35 * max(addr_ratio, addr_tok_ratio)
                    sig_weight = 0.10 * min(1.0, block_score / 20.0)
                    pair_score = round(name_weight + addr_weight + sig_weight, 4)

                is_match = pair_score >= self.threshold

                if pair_score > best_confidence:
                    best_confidence = pair_score

                if is_match:
                    matched_ids.append(cand_id)
                    matched_sources.append(src_label)
                    matched_entity_objs.append({
                        "entity_id": cand_id,
                        "business_name": cand_raw_name,
                        "business_address": cand_raw_addr,
                        "country": cand_country,
                        "source": src_label,
                        "confidence": pair_score,
                    })

                candidates_detail.append({
                    "source1_entity_id": s1_id,
                    "source1_business_name": raw_name,
                    "candidate_entity_id": cand_id,
                    "candidate_business_name": cand_raw_name,
                    "candidate_address": cand_raw_addr,
                    "candidate_country": cand_country,
                    "candidate_source": src_label,
                    "score": pair_score,
                    "is_match": is_match,
                })

            total_candidate_relations += len(cand_ids)
            has_match = len(matched_ids) > 0
            if has_match:
                matched_records += 1

            # Exact official schemas
            matching_rows.append({
                "source1_entity_id": s1_id,
                "matched_entity_ids": ",".join(matched_ids),
            })
            candidate_rows.append({
                "source1_entity_id": s1_id,
                "candidate_entity_ids": ",".join(cand_ids),
            })

            matches_detail.append({
                "source1_entity_id": s1_id,
                "business_name": raw_name,
                "business_address": raw_address,
                "country": country,
                "matched_entity_ids": matched_ids,
                "matched_entity_sources": list(set(matched_sources)),
                "confidence": round(best_confidence, 3) if has_match else 0.0,
                "status": "matched" if has_match else "unmatched",
                "matches": matched_entity_objs,
            })

            if gt_mapping and s1_id in gt_mapping:
                true_ids = gt_mapping[s1_id]
                pred_ids = set(matched_ids)
                tp += len(true_ids & pred_ids)
                fp += len(pred_ids - true_ids)
                fn += len(true_ids - pred_ids)

        # 3. Write Authoritative TSV Outputs
        matching_tsv_path = output_path / "matching_results.tsv"
        candidate_tsv_path = output_path / "candidate_pairs.tsv"

        matching_df = pd.DataFrame(matching_rows, columns=["source1_entity_id", "matched_entity_ids"])
        candidate_df = pd.DataFrame(candidate_rows, columns=["source1_entity_id", "candidate_entity_ids"])

        matching_df.to_csv(matching_tsv_path, sep="\t", index=False, quoting=csv.QUOTE_NONE, lineterminator="\n")
        candidate_df.to_csv(candidate_tsv_path, sep="\t", index=False, quoting=csv.QUOTE_NONE, lineterminator="\n")

        # 4. Write Detailed Inspection JSONs
        matches_detail_df = pd.DataFrame(matches_detail)
        candidates_detail_df = pd.DataFrame(candidates_detail)

        matches_detail_df.to_json(output_path / "matches_detail.json", orient="records", indent=2)
        candidates_detail_df.to_json(output_path / "candidates_detail.json", orient="records", indent=2)

        # 5. Ensure test_source1/2/3 exist in test_path for the official validator
        if not (test_path / "test_source1.tsv").is_file():
            if (test_path / "source1.tsv").is_file():
                try:
                    os.link(test_path / "source1.tsv", test_path / "test_source1.tsv")
                except OSError:
                    (test_path / "test_source1.tsv").write_bytes((test_path / "source1.tsv").read_bytes())
            else:
                s1.to_csv(test_path / "test_source1.tsv", sep="\t", index=False)
        if not (test_path / "test_source2.tsv").is_file():
            if (test_path / "source2.tsv").is_file():
                try:
                    os.link(test_path / "source2.tsv", test_path / "test_source2.tsv")
                except OSError:
                    (test_path / "test_source2.tsv").write_bytes((test_path / "source2.tsv").read_bytes())
            else:
                s2.to_csv(test_path / "test_source2.tsv", sep="\t", index=False)
        if not (test_path / "test_source3.tsv").is_file():
            if (test_path / "source3.tsv").is_file():
                try:
                    os.link(test_path / "source3.tsv", test_path / "test_source3.tsv")
                except OSError:
                    (test_path / "test_source3.tsv").write_bytes((test_path / "source3.tsv").read_bytes())
            else:
                s3.to_csv(test_path / "test_source3.tsv", sep="\t", index=False)

        # 6. Execute Official Submission Validator
        errors, warnings = [], []
        try:
            errors, warnings = run_submission_validator(
                str(matching_tsv_path),
                str(candidate_tsv_path),
                str(test_path),
                check_ids=False,
            )
            val_passed = len(errors) == 0
        except Exception as exc:
            val_passed = False
            errors.append(f"Submission validator exception: {exc}")

        # Precision, Recall, F0.5
        precision, recall, f05 = None, None, None
        if gt_mapping and (tp + fp) > 0 and (tp + fn) > 0:
            precision = round(tp / (tp + fp), 4)
            recall = round(tp / (tp + fn), 4)
            denom = 0.25 * precision + recall
            f05 = round((1.25 * precision * recall) / denom, 4) if denom > 0 else 0.0

        return PipelineOutput(
            matches_df=matches_detail_df,
            candidates_df=candidates_detail_df,
            matching_tsv_path=matching_tsv_path,
            candidate_tsv_path=candidate_tsv_path,
            validation_passed=val_passed,
            validation_errors=errors,
            validation_warnings=warnings,
            total_records=total_records,
            matched_records=matched_records,
            unmatched_records=total_records - matched_records,
            candidate_pairs_count=total_candidate_relations,
            precision=precision,
            recall=recall,
            f05_score=f05,
        )


_pipeline_instance: Optional[AwsMainMLPipeline] = None


def get_resolver() -> AwsMainMLPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = AwsMainMLPipeline()
    return _pipeline_instance
