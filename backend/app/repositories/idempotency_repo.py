"""Repositorio para manejo de claves de idempotencia."""
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.idempotency import IdempotencyKey

DEFAULT_TTL_HOURS = 24


def get_idempotency_key(
    db: Session,
    key: str,
    route: str,
    method: str,
    request_body: Optional[dict] = None
) -> Optional[IdempotencyKey]:
    """
    Obtiene una clave de idempotencia existente.
    
    Si hay request_body, calcula hash y lo compara también.
    """
    query = db.query(IdempotencyKey).filter(
        and_(
            IdempotencyKey.key == key,
            IdempotencyKey.route == route,
            IdempotencyKey.method == method,
            IdempotencyKey.expires_at > datetime.utcnow()
        )
    )
    
    if request_body:
        request_hash = _hash_request_body(request_body)
        query = query.filter(IdempotencyKey.request_hash == request_hash)
    
    return query.first()


def create_idempotency_key(
    db: Session,
    key: str,
    route: str,
    method: str,
    status_code: int,
    response_body: Optional[dict] = None,
    request_body: Optional[dict] = None,
    ttl_hours: int = DEFAULT_TTL_HOURS
) -> IdempotencyKey:
    """Crea o actualiza una clave de idempotencia."""
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
        expires_at=expires_at
    )
    
    db.add(idempotency_key)
    db.commit()
    db.refresh(idempotency_key)
    
    return idempotency_key


def _hash_request_body(body: dict) -> str:
    """Calcula hash SHA256 del body de la request."""
    body_str = json.dumps(body, sort_keys=True, default=str)
    return hashlib.sha256(body_str.encode()).hexdigest()


def cleanup_expired_keys(db: Session) -> int:
    """Elimina claves de idempotencia expiradas. Retorna cantidad eliminada."""
    count = db.query(IdempotencyKey).filter(
        IdempotencyKey.expires_at < datetime.utcnow()
    ).delete()
    db.commit()
    return count

