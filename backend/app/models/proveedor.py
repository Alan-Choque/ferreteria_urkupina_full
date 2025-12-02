from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, Boolean, ForeignKey, Table, Column, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.compra import OrdenCompra
    from app.models.producto import Producto

# Tabla de asociación muchos a muchos: Proveedor - Producto
proveedor_producto_table = Table(
    "proveedor_producto",
    Base.metadata,
    Column("proveedor_id", Integer, ForeignKey("dbo.proveedores.id"), nullable=False),
    Column("producto_id", Integer, ForeignKey("dbo.productos.id"), nullable=False),
    PrimaryKeyConstraint("proveedor_id", "producto_id"),
    schema="dbo"
)


class ContactoProveedor(Base):
    """Contactos adicionales de un proveedor (vendedores, representantes, etc.)"""
    __tablename__ = "contactos_proveedor"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("dbo.proveedores.id"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    cargo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    correo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    proveedor: Mapped["Proveedor"] = relationship("Proveedor", back_populates="contactos")


class Proveedor(Base):
    __tablename__ = "proveedores"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    nit_ci: Mapped[str | None] = mapped_column(String(20), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    correo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    ordenes_compra: Mapped[List["OrdenCompra"]] = relationship(
        "OrdenCompra",
        back_populates="proveedor",
    )
    contactos: Mapped[List["ContactoProveedor"]] = relationship(
        "ContactoProveedor",
        back_populates="proveedor",
    )
    productos: Mapped[List["Producto"]] = relationship(
        "Producto",
        secondary=proveedor_producto_table,
        back_populates="proveedores",
    )
