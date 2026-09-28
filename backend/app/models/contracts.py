from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Generic, List, Literal, Optional, TypeVar
from pydantic import BaseModel, Field

RunStage = Literal[
    "queued",
    "validating",
    "preprocessing",
    "candidate_generation",
    "matching",
    "validation",
    "completed",
    "failed",
    "cancelled",
]
RunStatus = RunStage

class DatasetInfo(BaseModel):
    dataset_id: str
    source: str
    role: str = "Reference entities"
    filename: str
    size_bytes: int
    record_count: Optional[int] = None
    valid: bool
    errors: list[str] = Field(default_factory=list)
    columns: list[str] = Field(default_factory=list)
    delimiter: str = "\t"
    encoding: str = "UTF-8"

class PreFlightSourceCheck(BaseModel):
    source: str
    role: str
    filename: Optional[str] = None
    valid: bool
    record_count: Optional[int] = None
    errors: list[str] = Field(default_factory=list)

class PreFlightResponse(BaseModel):
    can_run: bool
    ml_ready: bool
    ml_model_name: str
    sources_valid: bool
    storage_writable: bool
    sources: list[PreFlightSourceCheck]
    reasons: list[str] = Field(default_factory=list)

class ReadinessResponse(BaseModel):
    ready: bool
    api_online: bool
    ml_ready: bool
    model_name: str
    dependencies: dict[str, bool]
    storage_writable: bool
    errors: list[str] = Field(default_factory=list)

class RunInfo(BaseModel):
    run_id: str
    status: RunStatus
    stage: Optional[RunStage] = None
    model: str
    mode: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    exit_code: Optional[int] = None
    error: Optional[str] = None
    error_stage: Optional[str] = None
    error_category: Optional[str] = None
    idempotency_key: Optional[str] = None
    workspace_dir: Optional[str] = None
    records_processed: Optional[int] = None
    record_count: Optional[int] = None
    matched_count: Optional[int] = None
    unmatched_count: Optional[int] = None
    candidate_count: Optional[int] = None

class MatchResult(BaseModel):
    source1_entity_id: str
    business_name: str
    business_address: str
    country: str
    matched_entity_ids: list[str] = Field(default_factory=list)
    matched_entity_sources: list[str] = Field(default_factory=list)
    confidence: Optional[float] = None
    status: Literal["matched", "unmatched"]

class CandidatePair(BaseModel):
    source1_entity_id: str
    source1_business_name: str
    candidate_entity_id: str
    candidate_business_name: str
    candidate_address: str
    candidate_country: str
    candidate_source: str
    score: float
    is_match: bool

T = TypeVar("T")

class PageResult(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int

class ValidationResult(BaseModel):
    run_id: str
    status: Literal["VALID", "FAILED"]
    passed: bool = True
    checks: list[dict]
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    f05: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    coverage: Optional[float] = None
    rows_validated: Optional[int] = None

