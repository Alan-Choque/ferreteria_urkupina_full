"""Servicio de usuarios con idempotencia, RBAC y utilidades administrativas."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Iterable, Optional

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token
from app.models.cliente import Cliente
from app.models.usuario import Rol, Usuario
from app.repositories.idempotency_repo import create_idempotency_key, get_idempotency_key
from app.repositories.user_repo import UserFilter, UserRepository
from app.schemas.auth import RegisterRequest, Token, UserResponse
from app.schemas.user import (
    RoleResponse,
    UserCreateRequest,
    UserListResponse,
    UserSummary,
    UserUpdateRolesRequest,
    UserUpdateRequest,
)

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class UserService:
    db: Session
    _repo: UserRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = UserRepository(self.db)
    
    @property
    def db_session(self) -> Session:
        """Propiedad para acceder a la sesión de DB desde métodos estáticos si es necesario"""
        return self.db

    # -------------------------------------------------------------------------
    # Registro (autoregistro) con idempotencia
    # -------------------------------------------------------------------------
    def register_user(
        self,
        request_data: RegisterRequest,
        *,
        idempotency_key: Optional[str] = None,
        request_path: str = "/api/v1/auth/register",
        request_method: str = "POST",
    ) -> tuple[UserResponse, Token]:
        if idempotency_key:
            cached = get_idempotency_key(
                self.db,
                key=idempotency_key,
                route=request_path,
                method=request_method,
                request_body=request_data.model_dump(),
            )
            if cached:
                if cached.status_code >= 400:
                    detail = {}
                    if cached.response_body:
                        detail = json.loads(cached.response_body)
                    raise HTTPException(status_code=cached.status_code, detail=detail or "Error previo")
                payload = json.loads(cached.response_body) if cached.response_body else {}
                return (
                    UserResponse(**payload["user"]),
                    Token(**payload["token"]),
                )

        # Verificar si el email ya existe como usuario o cliente
        if existing := self._repo.get_by_email(request_data.email):
            self._record_idempotent_error(
                idempotency_key,
                request_path,
                request_method,
                request_data,
                status.HTTP_409_CONFLICT,
                code="EMAIL_ALREADY_REGISTERED",
                message="Este correo electrónico ya está registrado. Si ya tienes una cuenta, intenta iniciar sesión.",
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "EMAIL_ALREADY_REGISTERED", "message": "Este correo electrónico ya está registrado. Si ya tienes una cuenta, intenta iniciar sesión."}},
            )
        
        # Verificar también si existe como cliente (aunque no debería ser necesario si el email es único)
        from app.models.cliente import Cliente
        existing_cliente = self.db.query(Cliente).filter(Cliente.correo == request_data.email).first()
        if existing_cliente:
            self._record_idempotent_error(
                idempotency_key,
                request_path,
                request_method,
                request_data,
                status.HTTP_409_CONFLICT,
                code="EMAIL_ALREADY_REGISTERED",
                message="Este correo electrónico ya está registrado como cliente. Si ya tienes una cuenta, intenta iniciar sesión.",
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "EMAIL_ALREADY_REGISTERED", "message": "Este correo electrónico ya está registrado como cliente. Si ya tienes una cuenta, intenta iniciar sesión."}},
            )

        try:
            # Crear el usuario para autenticación (para que puedan iniciar sesión y ver sus pedidos)
            user = self._repo.create(
                nombre_usuario=request_data.username,
                correo=request_data.email,
                password=request_data.password,
            )
            
            # Crear también un cliente asociado al usuario registrado
            # Esto permite que el cliente pueda hacer pedidos y reservas
            # MEJORADO: Ahora usamos la relación directa usuario_id en lugar de solo email
            from datetime import datetime
            try:
                # Normalizar email para almacenamiento consistente
                email_normalizado = request_data.email.strip().lower()
                
                # Verificar si ya existe un cliente con este email
                existing_cliente = self.db.query(Cliente).filter(
                    Cliente.correo == email_normalizado
                ).first()
                
                if existing_cliente:
                    # Si existe, actualizar su usuario_id para vincularlo
                    if not existing_cliente.usuario_id:
                        existing_cliente.usuario_id = user.id
                        existing_cliente.nombre = request_data.username
                        if request_data.nit_ci:
                            existing_cliente.nit_ci = request_data.nit_ci
                        if request_data.telefono:
                            existing_cliente.telefono = request_data.telefono
                        self.db.commit()
                        logger.info(f"Cliente existente {existing_cliente.id} vinculado al usuario {user.id}")
                    else:
                        logger.info(f"Cliente {existing_cliente.id} ya tiene usuario asociado")
                else:
                    # Crear nuevo cliente vinculado al usuario
                    cliente = Cliente(
                        nombre=request_data.username,
                        correo=email_normalizado,
                        nit_ci=request_data.nit_ci,
                        telefono=request_data.telefono,
                        fecha_registro=datetime.utcnow(),
                        usuario_id=user.id,  # VINCULACIÓN DIRECTA
                    )
                    self.db.add(cliente)
                    self.db.commit()
                    self.db.refresh(cliente)
                    logger.info(f"Cliente {cliente.id} creado y vinculado al usuario {user.id}")
            except IntegrityError as e:
                # Si el cliente ya existe (mismo correo o mismo usuario_id), continuar sin error
                self.db.rollback()
                logger.info("Cliente ya existe para correo %s o usuario %s, continuando", request_data.email, user.id)
            
        except IntegrityError as e:
            # Determinar qué campo causó el error
            error_msg = "El correo electrónico o nombre de usuario ya está registrado"
            if "correo" in str(e).lower() or "email" in str(e).lower():
                error_msg = "Este correo electrónico ya está registrado. Si ya tienes una cuenta, intenta iniciar sesión."
            elif "nombre_usuario" in str(e).lower() or "username" in str(e).lower():
                error_msg = "Este nombre de usuario ya está en uso. Por favor, elige otro."
            
            self._record_idempotent_error(
                idempotency_key,
                request_path,
                request_method,
                request_data,
                status.HTTP_409_CONFLICT,
                code="EMAIL_ALREADY_REGISTERED",
                message=error_msg,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "EMAIL_ALREADY_REGISTERED",
                        "message": error_msg,
                    }
                },
            )

        token = self._build_token_pair(user)
        response = self._map_user_response(user)
        if idempotency_key:
            create_idempotency_key(
                self.db,
                key=idempotency_key,
                route=request_path,
                method=request_method,
                status_code=status.HTTP_201_CREATED,
                response_body={"user": response.model_dump(), "token": token.model_dump()},
                request_body=request_data.model_dump(),
            )
            return response, token
        
        return response, token

    # -------------------------------------------------------------------------
    # Consultas administrativas
    # -------------------------------------------------------------------------
    def list_users(self, *, search: str | None, active: bool | None, page: int, page_size: int) -> UserListResponse:
        try:
            filters = UserFilter(search=search, active=active)
            users, total = self._repo.list(filters, page, page_size)
            items = []
            for user in users:
                try:
                    # Intentar mapear el usuario normalmente
                    items.append(self._map_user_summary(user))
                except Exception as e:
                    logger.error(f"Error mapeando usuario {user.id}: {e}", exc_info=True)
                    # Si falla, intentar crear un usuario con datos mínimos
                    try:
                        # Intentar obtener roles de forma segura
                        roles_list = []
                        if hasattr(user, 'roles'):
                            try:
                                # Intentar cargar roles explícitamente
                                self.db.refresh(user, ['roles'])
                                roles_list = [rol.nombre for rol in (user.roles or [])]
                            except Exception as refresh_error:
                                # Si refresh falla, intentar acceder directamente
                                try:
                                    roles_list = [rol.nombre for rol in (user.roles or [])]
                                except Exception:
                                    # Si todo falla, dejar roles vacío
                                    logger.warning(f"No se pudieron cargar roles para usuario {user.id}: {refresh_error}")
                                    roles_list = []
                        
                        items.append(UserSummary(
                            id=user.id,
                            nombre_usuario=getattr(user, 'nombre_usuario', 'N/A') or "N/A",
                            correo=getattr(user, 'correo', 'N/A') or "N/A",
                            activo=bool(getattr(user, 'activo', False)),
                            roles=roles_list,
                        ))
                    except Exception as fallback_error:
                        logger.error(f"Error incluso en fallback para usuario {getattr(user, 'id', 'unknown')}: {fallback_error}")
                        continue
            return UserListResponse(items=items, total=total, page=page, page_size=page_size)
        except Exception as e:
            logger.error(f"Error en list_users: {type(e).__name__}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al listar usuarios: {str(e)}"
            ) from e

    def get_user(self, user_id: int) -> UserResponse:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        return self._map_user_response(user)

    def list_roles(self) -> list[RoleResponse]:
        roles = self._repo.list_roles()
        return [RoleResponse(id=role.id, nombre=role.nombre, descripcion=role.descripcion) for role in roles]

    def create_user(self, payload: UserCreateRequest) -> UserResponse:
        # Verificar si el email o username ya existen antes de intentar crear
        existing_email = self._repo.get_by_email(payload.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "EMAIL_ALREADY_EXISTS", "message": "Este correo electrónico ya está registrado. Por favor, usa otro correo."}},
            )
        
        existing_username = self._repo.get_by_username(payload.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "USERNAME_ALREADY_EXISTS", "message": "Este nombre de usuario ya está en uso. Por favor, elige otro."}},
            )
        
        try:
            user = self._repo.create(
                nombre_usuario=payload.username,
                correo=payload.email,
                password=payload.password,
                activo=payload.activo,
                roles=payload.role_ids,
            )
        except IntegrityError as e:
            # Si aún así hay un IntegrityError (por ejemplo, por constraint de DB), usar el mensaje del error
            error_msg = str(e.orig) if hasattr(e, 'orig') and e.orig else "El usuario ya existe"
            if "correo" in error_msg.lower() or "email" in error_msg.lower():
                error_msg = "Este correo electrónico ya está registrado. Por favor, usa otro correo."
            elif "nombre_usuario" in error_msg.lower() or "username" in error_msg.lower():
                error_msg = "Este nombre de usuario ya está en uso. Por favor, elige otro."
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "USER_ALREADY_EXISTS", "message": error_msg}},
            ) from e
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        return self._map_user_response(user)

    def update_roles(self, user_id: int, payload: UserUpdateRolesRequest) -> UserResponse:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        try:
            user = self._repo.update_roles(user, payload.role_ids or [])
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        return self._map_user_response(user)

    def set_active(self, user_id: int, activo: bool) -> UserResponse:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        user = self._repo.update_status(user, activo)
        return self._map_user_response(user)

    def update_user(self, user_id: int, payload: UserUpdateRequest) -> UserResponse:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        try:
            updated = self._repo.update_details(
                user,
                nombre_usuario=payload.username,
                correo=payload.email,
                activo=payload.activo,
            )
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "USER_ALREADY_EXISTS", "message": "El correo o usuario ya existe"}},
            ) from None
        return self._map_user_response(updated)

    def delete_user(self, user_id: int) -> None:
        if user_id == 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede eliminar al usuario raíz")
        user = self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        self._repo.delete(user)

    def send_password_reset(self, user_id: int) -> None:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        # Aquí podríamos integrar un servicio real de email. Por ahora sólo dejamos constancia en logs.
        logger.info("Solicitud de restablecimiento de contraseña para usuario %s (%s)", user.id, user.correo)

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------
    def _record_idempotent_error(
        self,
        idempotency_key: Optional[str],
        path: str,
        method: str,
        request_data: RegisterRequest,
        status_code: int,
        *,
        code: str,
        message: str,
    ) -> None:
        if not idempotency_key:
            return
        create_idempotency_key(
            self.db,
            key=idempotency_key,
            route=path,
            method=method,
            status_code=status_code,
            response_body={"error": {"code": code, "message": message}},
            request_body=request_data.model_dump(),
        )

    @staticmethod
    def _map_user_response(user: Usuario) -> UserResponse:
        # Manejar casos donde los roles no estén cargados o sean None
        try:
            roles = [rol.nombre for rol in (user.roles or [])] if hasattr(user, 'roles') and user.roles is not None else []
        except Exception as e:
            logger.warning(f"Error al obtener roles del usuario {user.id}: {e}")
            roles = []
        
        return UserResponse(
            id=user.id,
            nombre_usuario=user.nombre_usuario,
            correo=user.correo,
            activo=bool(user.activo),
            roles=roles,
        )

    @staticmethod
    def _map_user_summary(user: Usuario) -> UserSummary:
        # Manejar casos donde los roles no estén cargados o sean None
        roles = []
        try:
            if hasattr(user, 'roles'):
                # Intentar acceder a los roles
                user_roles = user.roles
                if user_roles is not None:
                    try:
                        # Intentar iterar sobre los roles
                        roles = [rol.nombre for rol in user_roles if hasattr(rol, 'nombre')]
                    except Exception as iter_error:
                        logger.warning(f"Error al iterar roles del usuario {user.id}: {iter_error}")
                        roles = []
                else:
                    roles = []
        except Exception as e:
            logger.warning(f"Error al obtener roles del usuario {getattr(user, 'id', 'unknown')}: {e}")
            roles = []
        
        return UserSummary(
            id=getattr(user, 'id', 0),
            nombre_usuario=getattr(user, 'nombre_usuario', 'N/A'),
            correo=getattr(user, 'correo', 'N/A'),
            activo=bool(getattr(user, 'activo', False)),
            roles=roles,
        )

    @staticmethod
    def _build_token_pair(user: Usuario) -> Token:
        subject = str(user.id)
        return Token(
            access_token=create_access_token(data={"sub": subject}),
            refresh_token=create_refresh_token(data={"sub": subject}),
            token_type="bearer",
        )