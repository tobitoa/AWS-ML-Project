from fastapi import APIRouter
from ..models.contracts import ValidationResult
from ..services.validation_service import validate_run

router = APIRouter(prefix="/validation", tags=["validation"])

@router.post("/{run_id}", response_model=ValidationResult)
def validate(run_id: str) -> dict:
    return validate_run(run_id)

@router.get("/{run_id}", response_model=ValidationResult)
def get_validation(run_id: str) -> dict:
    return validate_run(run_id)
