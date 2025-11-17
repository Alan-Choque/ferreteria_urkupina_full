from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Optional, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_password_hash
from app.models.usuario import Permiso, Rol, Usuario

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class UserFilter:
    search: str | None = None
    active: bool | None = None


class UserRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return select(Usuario).options(joinedload(Usuario.roles))

    def _apply_filters(self, stmt, filters: UserFilter):
        conditions = []
        if filters.search:
            pattern = f"%{filters.search.strip()}%"
            conditions.append(
                or_(Usuario.nombre_usuario.ilike(pattern), Usuario.correo.ilike(pattern))
            )
        if filters.active is not None:
            conditions.append(Usuario.activo == filters.active)
        if conditions:
            stmt = stmt.where(*conditions)
        return stmt

    def list(self, filters: UserFilter, page: int, page_size: int) -> tuple[list[Usuario], int]:
        stmt = self._apply_filters(self._base_stmt(), filters).order_by(Usuario.id.asc())
        total_stmt = self._apply_filters(select(func.count()).select_from(Usuario), filters)
        total = self._db.scalar(total_stmt) or 0
        result = self._db.scalars(
            stmt.offset((page - 1) * page_size).limit(page_size)
        )
        users: Sequence[Usuario] = result.unique().all()
        return list(users), total

    def list_roles(self) -> list[Rol]:
        stmt = select(Rol).order_by(Rol.nombre.asc())
        return list(self._db.scalars(stmt).all())

    def list_permissions(self) -> list[Permiso]:
        stmt = select(Permiso).order_by(Permiso.nombre.asc())
        return list(self._db.scalars(stmt).all())

    def get_by_id(self, user_id: int) -> Usuario | None:
        stmt = self._base_stmt().where(Usuario.id == user_id)
        return self._db.scalars(stmt).first()

    def get_by_email(self, correo: str) -> Usuario | None:
        stmt = self._base_stmt().where(Usuario.correo == correo.strip().lower())
        return self._db.scalars(stmt).first()

    def get_by_username(self, username: str) -> Usuario | None:
        stmt = self._base_stmt().where(Usuario.nombre_usuario == username.strip())
        return self._db.scalars(stmt).first()

    def create(
        self,
        *,
        nombre_usuario: str,
        correo: str,
        password: str,
        activo: bool = True,
        roles: Iterable[int] | None = None,
    ) -> Usuario:
        correo = correo.strip().lower()
        nombre_usuario = nombre_usuario.strip()

        existing = self._db.scalar(
            select(Usuario).where(
                or_(Usuario.correo == correo, Usuario.nombre_usuario == nombre_usuario)
            )
        )
        if existing:
            msg = "El correo electrónico ya está registrado" if existing.correo == correo else "El nombre de usuario ya está en uso"
            raise IntegrityError(statement="INSERT usuarios", params=None, orig=Exception(msg))

        now = datetime.utcnow()
        user = Usuario(
            nombre_usuario=nombre_usuario,
            correo=correo,
            hash_contrasena=get_password_hash(password),
            fecha_creacion=now,
            fecha_modificacion=now,
            activo=activo,
        )

        if roles:
            user.roles = self._fetch_roles(list(roles))

        self._db.add(user)
        try:
            self._db.commit()
            self._db.refresh(user)
            return user
        except IntegrityError:
            self._db.rollback()
            raise

    def update_roles(self, user: Usuario, role_ids: Iterable[int]) -> Usuario:
        user.roles = self._fetch_roles(list(role_ids))
        user.fecha_modificacion = datetime.utcnow()
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def update_status(self, user: Usuario, activo: bool) -> Usuario:
        user.activo = activo
        user.fecha_modificacion = datetime.utcnow()
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def update_details(
        self,
        user: Usuario,
        *,
        nombre_usuario: str | None = None,
        correo: str | None = None,
        activo: bool | None = None,
    ) -> Usuario:
        if nombre_usuario is not None:
            user.nombre_usuario = nombre_usuario.strip()
        if correo is not None:
            user.correo = correo.strip().lower()
        if activo is not None:
            user.activo = activo
        user.fecha_modificacion = datetime.utcnow()
        self._db.add(user)
        try:
            self._db.commit()
        except IntegrityError as exc:
            self._db.rollback()
            raise exc
        self._db.refresh(user)
        return user

    def delete(self, user: Usuario) -> None:
        self._db.delete(user)
        self._db.commit()

    def _fetch_roles(self, ids: list[int]) -> list[Rol]:
        if not ids:
            return []
        stmt = select(Rol).where(Rol.id.in_(ids))
        roles = list(self._db.scalars(stmt).all())
        if len(roles) != len(ids):
            missing = set(ids) - {role.id for role in roles}
            msg = f"Roles inexistentes: {sorted(missing)}"
            raise ValueError(msg)
        return roles

