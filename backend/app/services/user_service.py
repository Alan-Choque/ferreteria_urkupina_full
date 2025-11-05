"""Servicio de usuarios con idempotencia y manejo de errores."""
import logging
from typing import Optional
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.repositories.user_repo import create_user, get_user_by_email
from app.repositories.idempotency_repo import (
    get_idempotency_key,
    create_idempotency_key
)
from app.models.usuario import Usuario
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import RegisterRequest, Token, UserResponse

logger = logging.getLogger(__name__)


def register_user(
    db: Session,
    request_data: RegisterRequest,
    idempotency_key: Optional[str] = None,
    request_path: str = "/api/v1/auth/register",
    request_method: str = "POST"
) -> tuple[UserResponse, Token]:
    """
    Registra un nuevo usuario con soporte de idempotencia.
    
    Si se proporciona idempotency_key y ya existe una respuesta para esa key,
    retorna la respuesta almacenada sin crear duplicados.
    
    Args:
        db: Sesión de base de datos
        request_data: Datos de registro
        idempotency_key: Clave de idempotencia (opcional)
        request_path: Ruta de la request (para idempotencia)
        request_method: Método HTTP (para idempotencia)
    
    Returns:
        Tupla (UserResponse, Token)
    
    Raises:
        HTTPException: 409 si el usuario ya existe, 400 si hay error de validación
    """
    # Verificar idempotencia si hay key
    if idempotency_key:
        existing = get_idempotency_key(
            db,
            key=idempotency_key,
            route=request_path,
            method=request_method,
            request_body=request_data.model_dump()
        )
        
        if existing:
            logger.info(f"Idempotencia: reutilizando respuesta para key {idempotency_key}")
            
            # Si el status_code es de error (4xx, 5xx), lanzar HTTPException
            if existing.status_code >= 400:
                import json
                error_data = json.loads(existing.response_body) if existing.response_body else {}
                raise HTTPException(
                    status_code=existing.status_code,
                    detail=error_data.get("error", {"message": "Error en request anterior"})
                )
            
            # Reconstruir respuesta exitosa desde JSON almacenado
            import json
            response_data = json.loads(existing.response_body) if existing.response_body else {}
            user_response = UserResponse(**response_data.get("user", {}))
            token_response = Token(**response_data.get("token", {}))
            return user_response, token_response
    
    # Verificar si el usuario ya existe (sin idempotency_key o primera vez)
    existing_user = get_user_by_email(db, request_data.email)
    if existing_user:
        # Si hay idempotency_key, almacenar 409 para futuras requests
        if idempotency_key:
            create_idempotency_key(
                db,
                key=idempotency_key,
                route=request_path,
                method=request_method,
                status_code=409,
                response_body={
                    "error": {
                        "code": "USER_ALREADY_EXISTS",
                        "message": "El correo electrónico ya está registrado"
                    }
                },
                request_body=request_data.model_dump()
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": {
                    "code": "USER_ALREADY_EXISTS",
                    "message": "El correo electrónico ya está registrado"
                }
            }
        )
    
    # Crear usuario dentro de transacción
    try:
        user = create_user(
            db,
            nombre_usuario=request_data.username,
            correo=request_data.email,
            password=request_data.password,
            activo=True
        )
        
        # Generar tokens
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        # Construir respuestas
        user_response = UserResponse(
            id=user.id,
            nombre_usuario=user.nombre_usuario,
            correo=user.correo,
            activo=user.activo,
            roles=[]  # Usuario nuevo no tiene roles asignados aún
        )
        
        token_response = Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
        
        # Almacenar respuesta para idempotencia si hay key
        if idempotency_key:
            create_idempotency_key(
                db,
                key=idempotency_key,
                route=request_path,
                method=request_method,
                status_code=201,
                response_body={
                    "user": user_response.model_dump(),
                    "token": token_response.model_dump()
                },
                request_body=request_data.model_dump()
            )
        
        logger.info(f"Usuario registrado exitosamente: {user.id} - {user.correo}")
        return user_response, token_response
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Error de integridad al crear usuario: {e}")
        
        # Verificar si es duplicado
        error_code = str(e.orig) if hasattr(e, 'orig') else str(e)
        if '2627' in error_code or '2601' in error_code or 'UNIQUE' in error_code.upper():
            # Si hay idempotency_key, almacenar 409
            if idempotency_key:
                create_idempotency_key(
                    db,
                    key=idempotency_key,
                    route=request_path,
                    method=request_method,
                    status_code=409,
                    response_body={
                        "error": {
                            "code": "USER_ALREADY_EXISTS",
                            "message": "El correo electrónico o nombre de usuario ya está registrado"
                        }
                    },
                    request_body=request_data.model_dump()
                )
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "USER_ALREADY_EXISTS",
                        "message": "El correo electrónico o nombre de usuario ya está registrado"
                    }
                }
            )
        
        # Otro error de integridad
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INTEGRITY_ERROR",
                    "message": "Error al crear el usuario"
                }
            }
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error inesperado al crear usuario: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Error interno del servidor"
                }
            }
        )

