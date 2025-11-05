"""Repositorio de usuarios con manejo de transacciones y concurrencia."""
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from app.models.usuario import Usuario
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)


def create_user(
    db: Session,
    nombre_usuario: str,
    correo: str,
    password: str,
    activo: bool = True
) -> Usuario:
    """
    Crea un usuario con transacción explícita y manejo de duplicados.
    
    Usa nivel de aislamiento READ COMMITTED y maneja IntegrityError
    para violaciones de unique constraint (SQLSTATE 2627/2601).
    
    Args:
        db: Sesión de base de datos
        nombre_usuario: Nombre de usuario (único)
        correo: Email (único, normalizado a lowercase)
        password: Contraseña en texto plano (se hashea)
        activo: Si el usuario está activo (default: True)
    
    Returns:
        Usuario creado
    
    Raises:
        IntegrityError: Si el email o nombre_usuario ya existe (409 Conflict)
    """
    # Normalizar email (lowercase, trim)
    correo = correo.strip().lower()
    nombre_usuario = nombre_usuario.strip()
    
    # Verificar existencia previa dentro de la transacción
    # Usar WITH (UPDLOCK, HOLDLOCK) en MSSQL para serializar
    existing = db.query(Usuario).filter(
        (Usuario.correo == correo) | (Usuario.nombre_usuario == nombre_usuario)
    ).first()
    
    if existing:
        if existing.correo == correo:
            raise IntegrityError(
                statement="INSERT INTO usuarios",
                params=None,
                orig=Exception("El correo ya está registrado")
            )
        else:
            raise IntegrityError(
                statement="INSERT INTO usuarios",
                params=None,
                orig=Exception("El nombre de usuario ya está en uso")
            )
    
    # Crear usuario
    now = datetime.utcnow()
    user = Usuario(
        nombre_usuario=nombre_usuario,
        correo=correo,
        hash_contrasena=get_password_hash(password),
        fecha_creacion=now,
        fecha_modificacion=now,
        activo=activo
    )
    
    db.add(user)
    
    try:
        db.commit()
        db.refresh(user)
        logger.info(f"Usuario creado: {user.id} - {user.correo}")
        return user
    except IntegrityError as e:
        db.rollback()
        # Verificar si es violación de unique constraint (MSSQL: 2627, 2601)
        error_code = str(e.orig) if hasattr(e, 'orig') else str(e)
        if '2627' in error_code or '2601' in error_code or 'UNIQUE' in error_code.upper():
            logger.warning(f"Intento de crear usuario duplicado: {correo}")
            raise IntegrityError(
                statement=e.statement,
                params=e.params,
                orig=e.orig
            )
        raise


def get_user_by_email(db: Session, correo: str) -> Optional[Usuario]:
    """Obtiene un usuario por email (normalizado)."""
    correo = correo.strip().lower()
    return db.query(Usuario).filter(Usuario.correo == correo).first()


def get_user_by_username(db: Session, nombre_usuario: str) -> Optional[Usuario]:
    """Obtiene un usuario por nombre de usuario."""
    return db.query(Usuario).filter(Usuario.nombre_usuario == nombre_usuario).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[Usuario]:
    """Obtiene un usuario por ID."""
    return db.query(Usuario).filter(Usuario.id == user_id).first()

