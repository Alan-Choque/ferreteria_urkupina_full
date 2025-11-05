from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime, Text, Index
from app.db.base import Base


class IdempotencyKey(Base):
    """Tabla para almacenar claves de idempotencia y sus respuestas."""
    __tablename__ = "idempotency_keys"
    __table_args__ = (
        Index("idx_idempotency_key_route", "key", "route", "method"),
        {"schema": "dbo"}
    )
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    route: Mapped[str] = mapped_column(String(255), nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False)  # GET, POST, etc.
    request_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)  # SHA256 hash del body
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    response_body: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON serializado
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

