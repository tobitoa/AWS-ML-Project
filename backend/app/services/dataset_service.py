from __future__ import annotations

import io
import json
import re
from pathlib import Path
from typing import Optional, Tuple
import pandas as pd
from fastapi import HTTPException

from ..config import REQUIRED_COLUMNS, SOURCES, UPLOADS_DIR
from ..models.contracts import DatasetInfo

SOURCE_ROLES = {
    "source1": "Reference entities",
    "source2": "Candidate records",
    "source3": "Candidate records",
}

def safe_source(source: str) -> str:
    source_clean = str(source).strip().lower()
    if source_clean not in SOURCES:
        raise HTTPException(404, f"Unknown dataset source '{source}'. Must be one of: {', '.join(SOURCES)}")
    return source_clean

def sanitize_filename(filename: str) -> str:
    clean_name = Path(filename).name
    clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", clean_name)
    return clean_name or "dataset.tsv"

def source_path(source: str) -> Path:
    return UPLOADS_DIR / f"{safe_source(source)}.tsv"

def validate_raw_bytes(content: bytes, filename: str) -> Tuple[str, str]:
    if not content or len(content.strip()) == 0:
        raise ValueError("File is completely empty (0 bytes).")

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError(f"File is not valid UTF-8 encoded text: {exc}") from exc

    suffix = Path(filename).suffix.lower()
    first_line = text.splitlines()[0] if text.splitlines() else ""

    if suffix == ".tsv":
        if "\t" not in first_line and "," in first_line:
            raise ValueError("File has .tsv extension but appears to be comma-separated instead of tab-separated.")
        delim = "\t"
    elif suffix == ".csv":
        delim = ","
    else:
        delim = "\t" if "\t" in first_line else ","

    return delim, text

def read_frame(path: Path, filename: Optional[str] = None) -> pd.DataFrame:
    separator = "\t" if (filename or path.name).lower().endswith(".tsv") else ","
    try:
        return pd.read_csv(path, sep=separator, dtype=str, keep_default_na=False)
    except Exception as exc:
        raise ValueError(f"Could not read {path.name}: {exc}") from exc

def inspect_dataset(source: str, path: Path, filename: str, size: int) -> DatasetInfo:
    errors: list[str] = []
    count, columns = None, []
    role = SOURCE_ROLES.get(source, "Candidate records")
    delimiter = "\t"
    encoding = "UTF-8"

    try:
        frame = read_frame(path)
        columns = [str(column).strip() for column in frame.columns]
        missing = sorted(REQUIRED_COLUMNS - set(columns))
        errors.extend(f"Missing required column: {column}" for column in missing)
        count = len(frame)
        if not count:
            errors.append("The file contains no records.")
        if "entity_id" in frame and frame.entity_id.astype(str).str.strip().eq("").any():
            errors.append("The entity_id column contains blank values.")
        for column in ("business_name", "business_address", "country"):
            if column in frame and frame[column].astype(str).str.strip().eq("").any():
                errors.append(f"The {column} column contains blank values.")
        if "entity_id" in frame and frame.entity_id.duplicated().any():
            errors.append("The entity_id column contains duplicate entity IDs.")
    except ValueError as exc:
        errors.append(str(exc))

    return DatasetInfo(
        dataset_id=source,
        source=source,
        role=role,
        filename=filename,
        size_bytes=size,
        record_count=count,
        valid=not errors,
        errors=errors,
        columns=columns,
        delimiter=delimiter,
        encoding=encoding,
    )

def list_datasets() -> list[DatasetInfo]:
    items = []
    for source in SOURCES:
        path = source_path(source)
        if path.exists():
            meta = path.with_suffix(".meta")
            try:
                saved = json.loads(meta.read_text(encoding="utf-8")) if meta.exists() else {}
            except (json.JSONDecodeError, OSError):
                saved = {}
            filename = saved.get("filename", path.name)
            size = saved.get("size_bytes", path.stat().st_size)
            items.append(inspect_dataset(source, path, filename, size))
    return items

def load_inputs(directory: Optional[Path] = None) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    frames = []
    for source in SOURCES:
        path = directory / f"{source}.tsv" if directory else source_path(source)
        if not path.is_file():
            raise ValueError(f"Required dataset is missing: {source}.")
        frame = read_frame(path)
        missing = REQUIRED_COLUMNS - set(frame.columns)
        if missing or frame.empty:
            raise ValueError(f"{source}: missing required columns or no records.")
        if frame.entity_id.astype(str).str.strip().eq("").any() or frame.entity_id.duplicated().any():
            raise ValueError(f"{source}: entity_id values must be present and unique.")
        if any(frame[column].astype(str).str.strip().eq("").any() for column in ("business_name", "business_address", "country")):
            raise ValueError(f"{source}: business_name, business_address, and country values must be present.")
        frames.append(frame)
    return frames[0], frames[1], frames[2]

def delete_dataset(dataset_id: str) -> None:
    path = source_path(dataset_id)
    path.unlink(missing_ok=True)
    path.with_suffix(".meta").unlink(missing_ok=True)

