from fastapi import APIRouter
from ..ml.adapter import get_resolver

router = APIRouter(tags=["health"])

@router.get("/health")
def health() -> dict:
    resolver = get_resolver()
    return {"ok": True, "status": "healthy", "model_name": resolver.name, "model_mode": resolver.mode}
