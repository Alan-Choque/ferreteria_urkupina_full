from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, DateTime, Table, Column, ForeignKey, PrimaryKeyConstraint, Index
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cliente import Cliente

# Tabla de asociación many-to-many usuarios <-> roles
usuarios_roles_table = Table(
    "usuarios_roles",
    Base.metadata,
    Column("usuario_id", Integer, ForeignKey("dbo.usuarios.id"), nullable=False),
    Column("rol_id", Integer, ForeignKey("dbo.roles.id"), nullable=False),
    PrimaryKeyConstraint("usuario_id", "rol_id"),
    schema="dbo"
)

# Tabla de asociación many-to-many roles <-> permisos
roles_permisos_table = Table(
    "roles_permisos",
    Base.metadata,
    Column("rol_id", Integer, ForeignKey("dbo.roles.id"), nullable=False),
    Column("permiso_id", Integer, ForeignKey("dbo.permisos.id"), nullable=False),
    PrimaryKeyConstraint("rol_id", "permiso_id"),
    schema="dbo"
)


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        Index("ix_usuarios_correo", "correo"),  # Índice para búsquedas por email (login)
        Index("ix_usuarios_nombre_usuario", "nombre_usuario"),  # Índice para búsquedas por username
        {"schema": "dbo"}
    )
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre_usuario: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    correo: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    hash_contrasena: Mapped[str] = mapped_column(String(255), nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_modificacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Relationships
    roles: Mapped[list["Rol"]] = relationship(
        "Rol",
        secondary=usuarios_roles_table,
        back_populates="usuarios"
    )
    # Relación opcional con Cliente: un usuario puede tener máximo un cliente asociado
    cliente: Mapped["Cliente | None"] = relationship(
        "Cliente",
        back_populates="usuario",
        uselist=False,  # One-to-one relationship
    )
    # CORREGIDO: Removido cascade="all, delete-orphan" para preservar historial
    # Si se elimina un usuario, las órdenes se mantienen (solo se desvincula usuario_id)
    ordenes_compra: Mapped[list["OrdenCompra"]] = relationship(
        "OrdenCompra",
        back_populates="usuario",
        # cascade="save-update" permite actualizar, pero NO elimina órdenes al borrar usuario
    )
    ordenes_venta: Mapped[list["OrdenVenta"]] = relationship(
        "OrdenVenta",
        back_populates="usuario",
        foreign_keys="[OrdenVenta.usuario_id]",
        # cascade="save-update" permite actualizar, pero NO elimina órdenes al borrar usuario
        # foreign_keys especifica que solo use usuario_id, no repartidor_id
    )
    reservas: Mapped[list["Reserva"]] = relationship(
        "Reserva",
        back_populates="usuario",
        # cascade="save-update" permite actualizar, pero NO elimina reservas al borrar usuario
    )


class Rol(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Relationships
    usuarios: Mapped[list["Usuario"]] = relationship(
        "Usuario",
        secondary=usuarios_roles_table,
        back_populates="roles"
    )
    permisos: Mapped[list["Permiso"]] = relationship(
        "Permiso",
        secondary=roles_permisos_table,
        back_populates="roles"
    )


class Permiso(Base):
    __tablename__ = "permisos"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Relationships
    roles: Mapped[list["Rol"]] = relationship(
        "Rol",
        secondary=roles_permisos_table,
        back_populates="permisos"
    )


# Modelos legacy (no se usan directamente, pero se mantienen por compatibilidad)
# class UsuarioRol(Base):
#     __tablename__ = "usuarios_roles"
#     __table_args__ = {"schema": "dbo"}
    
#     usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("dbo.usuarios.id"), primary_key=True)
#     rol_id: Mapped[int] = mapped_column(Integer, ForeignKey("dbo.roles.id"), primary_key=True)


# class RolPermiso(Base):
#     __tablename__ = "roles_permisos"
#     __table_args__ = {"schema": "dbo"}
    
#     rol_id: Mapped[int] = mapped_column(Integer, ForeignKey("dbo.roles.id"), primary_key=True)
#     permiso_id: Mapped[int] = mapped_column(Integer, ForeignKey("dbo.permisos.id"), primary_key=True)
