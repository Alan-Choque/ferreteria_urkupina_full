from datetime import datetime
from typing import List

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrdenVenta(Base):
    __tablename__ = "ordenes_venta"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("dbo.clientes.id"), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)

    cliente: Mapped["Cliente"] = relationship("Cliente", back_populates="ordenes_venta")
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="ordenes_venta")
    items: Mapped[List["ItemOrdenVenta"]] = relationship(
        "ItemOrdenVenta",
        back_populates="orden",
        cascade="all, delete-orphan",
    )


class ItemOrdenVenta(Base):
    __tablename__ = "items_orden_venta"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    orden_venta_id: Mapped[int] = mapped_column(
        ForeignKey("dbo.ordenes_venta.id"),
        nullable=False,
    )
    variante_producto_id: Mapped[int] = mapped_column(
        ForeignKey("dbo.variantes_producto.id"),
        nullable=False,
    )
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    precio_unitario: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    orden: Mapped[OrdenVenta] = relationship("OrdenVenta", back_populates="items")
    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto")

