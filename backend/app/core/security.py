from datetime import datetime, timedelta
from hashlib import sha256
from typing import Any, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def _normalize_password(password: str) -> bytes:
    """
    Normaliza la contraseña para evitar la limitación de 72 bytes de bcrypt.

    Se aplica SHA-256 antes de bcrypt, de modo que cualquier longitud y conjunto
    de caracteres generen siempre 32 bytes.
    """
    return sha256(password.encode("utf-8")).digest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash.

    Incluye compatibilidad con hashes legacy generados sin normalización previa.
    """
    hashed_bytes = hashed_password.encode("utf-8")
    normalized = _normalize_password(plain_password)
    try:
        if bcrypt.checkpw(normalized, hashed_bytes):
            return True
    except ValueError:
        # Hash malformado
        return False

    # Compatibilidad con hashes previos (sin SHA-256 antes de bcrypt)
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_bytes)
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña."""
    normalized = _normalize_password(password)
    hashed = bcrypt.hashpw(normalized, bcrypt.gensalt())
    return hashed.decode("utf-8")


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT de acceso."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_alg)
    return encoded_jwt


def create_refresh_token(data: dict[str, Any]) -> str:
    """Crea un token JWT de refresco."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.refresh_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_alg)
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any]:
    """Decodifica un token JWT."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        return payload
    except JWTError:
        raise ValueError("Token inválido")


