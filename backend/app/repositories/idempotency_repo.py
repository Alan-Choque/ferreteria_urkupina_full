"""Repositorio para manejo de claves de idempotencia."""
import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import and_
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session

from app.models.idempotency import IdempotencyKey

DEFAULT_TTL_HOURS = 24
logger = logging.getLogger(__name__)


def _table_missing(exc: Exception) -> bool:
    """
    Determina si la excepción corresponde a una tabla inexistente.
    """
    message = str(exc).lower()
    return "invalid object name" in message and "idempotency_keys" in message


def get_idempotency_key(
    db: Session, key: str, route: str, method: str, request_body: Optional[dict] = None
) -> Optional[IdempotencyKey]:
    """
    Obtiene una clave de idempotencia existente.

    Si hay request_body, calcula hash y lo compara también.
    Si la tabla aún no existe, se devuelve None silenciosamente.
    """
    try:
        query = db.query(IdempotencyKey).filter(
            and_(
                IdempotencyKey.key == key,
                IdempotencyKey.route == route,
                IdempotencyKey.method == method,
                IdempotencyKey.expires_at > datetime.utcnow(),
            )
        )

        if request_body:
            request_hash = _hash_request_body(request_body)
            query = query.filter(IdempotencyKey.request_hash == request_hash)

        return query.first()
    except (ProgrammingError, OperationalError) as exc:
        if _table_missing(exc):
            logger.warning(
                "Tabla dbo.idempotency_keys no encontrada; omitiendo idempotencia hasta que exista."
            )
            db.rollback()
            return None
        raise


def create_idempotency_key(
    db: Session,
    key: str,
    route: str,
    method: str,
    status_code: int,
    response_body: Optional[dict] = None,
    request_body: Optional[dict] = None,
    ttl_hours: int = DEFAULT_TTL_HOURS,
) -> Optional[IdempotencyKey]:
    """
    Crea o actualiza una clave de idempotencia.
    Si la tabla no existe todavía, registra un warning y continúa sin fallar.
    """
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=ttl_hours)

    request_hash = _hash_request_body(request_body) if request_body else None
    response_json = json.dumps(response_body, default=str) if response_body else None

    idempotency_key = IdempotencyKey(
        key=key,
        route=route,
        method=method,
        request_hash=request_hash,
        status_code=status_code,
        response_body=response_json,
        created_at=now,
        expires_at=expires_at,
    )

    try:
        db.add(idempotency_key)
        db.commit()
        db.refresh(idempotency_key)
        return idempotency_key
    except (ProgrammingError, OperationalError) as exc:
        db.rollback()
        if _table_missing(exc):
            logger.warning(
                "Tabla dbo.idempotency_keys no encontrada al guardar clave %s; respuesta continuará sin idempotencia.",
                key,
            )
            return None
        raise


def _hash_request_body(body: dict) -> str:
    """Calcula hash SHA256 del body de la request."""
    body_str = json.dumps(body, sort_keys=True, default=str)
    return hashlib.sha256(body_str.encode()).hexdigest()


def cleanup_expired_keys(db: Session) -> int:
    """Elimina claves de idempotencia expiradas. Retorna cantidad eliminada."""
    try:
        count = (
            db.query(IdempotencyKey)
            .filter(IdempotencyKey.expires_at < datetime.utcnow())
            .delete()
        )
        db.commit()
        return count
    except (ProgrammingError, OperationalError) as exc:
        db.rollback()
        if _table_missing(exc):
            logger.warning(
                "Tabla dbo.idempotency_keys no encontrada al limpiar claves expiradas."
            )
            return 0
        raise

