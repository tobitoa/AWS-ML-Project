import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import FRONTEND_ORIGINS
from .api import candidates, datasets, health, results, runs, validation, search

app = FastAPI(title="ResoMesh API", version="1.0.0", description="Business Entity Resolution service powered by aws-main-ml")

# Support flexible CORS origins for Render / Vercel deployments
allow_all = "*" in FRONTEND_ORIGINS or os.getenv("RESOMESH_ALLOW_ALL_ORIGINS", "").lower() in ("1", "true", "yes")
if allow_all:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=FRONTEND_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

for router in (health.router, datasets.router, runs.router, results.router, candidates.router, validation.router, search.router):
    app.include_router(router, prefix="/api")
