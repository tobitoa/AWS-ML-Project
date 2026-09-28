from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import FRONTEND_ORIGINS
from .api import candidates, datasets, health, results, runs, validation, search

app = FastAPI(title="ResoMesh API", version="1.0.0", description="Business Entity Resolution service powered by aws-main-ml")
app.add_middleware(CORSMiddleware, allow_origins=FRONTEND_ORIGINS, allow_credentials=True, allow_methods=["GET", "POST", "DELETE"], allow_headers=["Content-Type", "Authorization"])
for router in (health.router, datasets.router, runs.router, results.router, candidates.router, validation.router, search.router):
    app.include_router(router, prefix="/api")
