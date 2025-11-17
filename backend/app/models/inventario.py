from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.almacen import Almacen
    from app.models.usuario import Usuario
    from app.models.variante_producto import VarianteProducto


class LibroStock(Base):
    __tablename__ = "libro_stock"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    variante_producto_id: Mapped[int] = mapped_column(ForeignKey("dbo.variantes_producto.id"), nullable=False)
    almacen_id: Mapped[int] = mapped_column(ForeignKey("dbo.almacenes.id"), nullable=False)
    tipo_movimiento: Mapped[str] = mapped_column(String(10), nullable=False)  # ENTRADA | SALIDA
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    fecha_movimiento: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)

    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto")
    almacen: Mapped["Almacen"] = relationship("Almacen")


class AjusteStock(Base):
    __tablename__ = "ajustes_stock"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)

    usuario: Mapped["Usuario | None"] = relationship("Usuario")
    items: Mapped[list["ItemAjusteStock"]] = relationship(
        "ItemAjusteStock",
        back_populates="ajuste",
        cascade="all, delete-orphan",
    )


class ItemAjusteStock(Base):
    __tablename__ = "items_ajuste_stock"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ajuste_stock_id: Mapped[int] = mapped_column(ForeignKey("dbo.ajustes_stock.id"), nullable=False)
    variante_producto_id: Mapped[int] = mapped_column(ForeignKey("dbo.variantes_producto.id"), nullable=False)
    cantidad_anterior: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    cantidad_nueva: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    ajuste: Mapped["AjusteStock"] = relationship("AjusteStock", back_populates="items")
    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto")


class TransferenciaStock(Base):
    __tablename__ = "transferencias_stock"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)
    almacen_origen_id: Mapped[int] = mapped_column(ForeignKey("dbo.almacenes.id"), nullable=False)
    almacen_destino_id: Mapped[int] = mapped_column(ForeignKey("dbo.almacenes.id"), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)

    usuario: Mapped["Usuario | None"] = relationship("Usuario")
    almacen_origen: Mapped["Almacen"] = relationship("Almacen", foreign_keys=[almacen_origen_id])
    almacen_destino: Mapped["Almacen"] = relationship("Almacen", foreign_keys=[almacen_destino_id])
    items: Mapped[list["ItemTransferenciaStock"]] = relationship(
        "ItemTransferenciaStock",
        back_populates="transferencia",
        cascade="all, delete-orphan",
    )


class ItemTransferenciaStock(Base):
    __tablename__ = "items_transferencia_stock"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    transferencia_stock_id: Mapped[int] = mapped_column(ForeignKey("dbo.transferencias_stock.id"), nullable=False)
    variante_producto_id: Mapped[int] = mapped_column(ForeignKey("dbo.variantes_producto.id"), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    transferencia: Mapped["TransferenciaStock"] = relationship("TransferenciaStock", back_populates="items")
    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto")

