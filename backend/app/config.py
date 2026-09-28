from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BASE_DIR.parent
AWS_MAIN_ML_DIR = ROOT_DIR / "aws-main-ml"

STORAGE_DIR = Path(os.getenv("RESOMESH_STORAGE_DIR", BASE_DIR / "storage")).resolve()
UPLOADS_DIR = STORAGE_DIR / "uploads"
RUNS_DIR = STORAGE_DIR / "runs"

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("RESOMESH_FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]
MAX_UPLOAD_BYTES = int(os.getenv("RESOMESH_MAX_UPLOAD_BYTES", str(100 * 1024 * 1024)))
REQUIRED_COLUMNS = {"entity_id", "business_name", "business_address", "country"}
SOURCES = ("source1", "source2", "source3")

for directory in (UPLOADS_DIR, RUNS_DIR):
    directory.mkdir(parents=True, exist_ok=True)
