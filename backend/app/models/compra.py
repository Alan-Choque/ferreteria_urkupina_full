from datetime import datetime
from typing import List

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrdenCompra(Base):
    __tablename__ = "ordenes_compra"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("dbo.proveedores.id"), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)

    proveedor: Mapped["Proveedor"] = relationship("Proveedor", back_populates="ordenes_compra")
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="ordenes_compra")
    items: Mapped[List["ItemOrdenCompra"]] = relationship(
        "ItemOrdenCompra",
        back_populates="orden",
        cascade="all, delete-orphan",
    )


class ItemOrdenCompra(Base):
    __tablename__ = "items_orden_compra"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    orden_compra_id: Mapped[int] = mapped_column(
        ForeignKey("dbo.ordenes_compra.id"),
        nullable=False,
    )
    variante_producto_id: Mapped[int] = mapped_column(
        ForeignKey("dbo.variantes_producto.id"),
        nullable=False,
    )
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    precio_unitario: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    orden: Mapped[OrdenCompra] = relationship("OrdenCompra", back_populates="items")
    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto")

