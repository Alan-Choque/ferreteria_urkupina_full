from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.api.v1.routes import api_router

app = FastAPI(title="Ferretería API", version="1.0.0")

allow_all_origins = "*" in settings.cors_origins
cors_allow_origins = ["*"] if allow_all_origins else settings.cors_origins
cors_allow_credentials = False if allow_all_origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_credentials=cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{settings.api_v1_prefix}/health")
def health(db: Session = Depends(get_db)):
    """Health check endpoint que verifica conexión a DB."""
    try:
        # Verificar conexión a DB con SELECT 1
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception:
        return {"status": "degraded"}

app.include_router(api_router, prefix=settings.api_v1_prefix)
