from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.api.v1.routes import api_router
from app.db.session import get_db

app = FastAPI(title="Ferretería API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(f"{settings.API_V1_STR}/health")
def health(db: Session = Depends(get_db)):
    """Health check endpoint que verifica conexión a DB."""
    try:
        # Verificar conexión a DB con SELECT 1
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception:
        return {"status": "degraded"}

app.include_router(api_router, prefix=settings.API_V1_STR)
