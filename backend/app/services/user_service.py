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

        if existing := self._repo.get_by_email(request_data.email):
            self._record_idempotent_error(
                idempotency_key,
                request_path,
                request_method,
                request_data,
                status.HTTP_409_CONFLICT,
                code="USER_ALREADY_EXISTS",
                message="El correo electrónico ya está registrado",
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "USER_ALREADY_EXISTS", "message": "El correo electrónico ya está registrado"}},
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
            from datetime import datetime
            try:
                cliente = Cliente(
                    nombre=request_data.username,
                    correo=request_data.email,
                    nit_ci=request_data.nit_ci,
                    telefono=request_data.telefono,
                    fecha_registro=datetime.utcnow(),
                )
                self.db.add(cliente)
                self.db.commit()
                self.db.refresh(cliente)
            except IntegrityError:
                # Si el cliente ya existe (mismo correo), continuar sin error
                self.db.rollback()
                logger.info("Cliente ya existe para correo %s, continuando con registro de usuario", request_data.email)
            
        except IntegrityError:
            self._record_idempotent_error(
                idempotency_key,
                request_path,
                request_method,
                request_data,
                status.HTTP_409_CONFLICT,
                code="USER_ALREADY_EXISTS",
                message="El correo electrónico o nombre de usuario ya está registrado",
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": {
                        "code": "USER_ALREADY_EXISTS",
                        "message": "El correo electrónico o nombre de usuario ya está registrado",
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

    # -------------------------------------------------------------------------
    # Consultas administrativas
    # -------------------------------------------------------------------------
    def list_users(self, *, search: str | None, active: bool | None, page: int, page_size: int) -> UserListResponse:
        filters = UserFilter(search=search, active=active)
        users, total = self._repo.list(filters, page, page_size)
        items = [self._map_user_summary(user) for user in users]
        return UserListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_user(self, user_id: int) -> UserResponse:
        user = self._repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        return self._map_user_response(user)

    def list_roles(self) -> list[RoleResponse]:
        roles = self._repo.list_roles()
        return [RoleResponse(id=role.id, nombre=role.nombre, descripcion=role.descripcion) for role in roles]

    def create_user(self, payload: UserCreateRequest) -> UserResponse:
        try:
            user = self._repo.create(
                nombre_usuario=payload.username,
                correo=payload.email,
                password=payload.password,
                activo=payload.activo,
                roles=payload.role_ids,
            )
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": {"code": "USER_ALREADY_EXISTS", "message": "El usuario ya existe"}},
            )
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
        return UserResponse(
            id=user.id,
            nombre_usuario=user.nombre_usuario,
            correo=user.correo,
            activo=bool(user.activo),
            roles=[rol.nombre for rol in user.roles],
        )

    @staticmethod
    def _map_user_summary(user: Usuario) -> UserSummary:
        return UserSummary(
            id=user.id,
            nombre_usuario=user.nombre_usuario,
            correo=user.correo,
            activo=bool(user.activo),
            roles=[rol.nombre for rol in user.roles],
        )

    @staticmethod
    def _build_token_pair(user: Usuario) -> Token:
        subject = str(user.id)
        return Token(
            access_token=create_access_token(data={"sub": subject}),
            refresh_token=create_refresh_token(data={"sub": subject}),
            token_type="bearer",
        )