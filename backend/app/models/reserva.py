from datetime import datetime
from typing import List

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Reserva(Base):
    __tablename__ = "reservas"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("dbo.clientes.id"), nullable=False)
    fecha_reserva: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDIENTE")  # PENDIENTE, CONFIRMADA, CANCELADA, COMPLETADA
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)
    
    # Campos de anticipio y pago
    monto_anticipio: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    fecha_anticipio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    metodo_pago_anticipio: Mapped[str | None] = mapped_column(String(50), nullable=True)  # EFECTIVO, QR, TARJETA
    numero_comprobante_anticipio: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Campos de confirmación y recordatorio
    fecha_confirmacion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_recordatorio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Campos de completado
    fecha_completado: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    orden_venta_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.ordenes_venta.id"), nullable=True)
    
    # Observaciones
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    cliente: Mapped["Cliente"] = relationship("Cliente", back_populates="reservas")
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="reservas")
    orden_venta: Mapped["OrdenVenta | None"] = relationship("OrdenVenta", foreign_keys=[orden_venta_id])
    items: Mapped[List["ItemReserva"]] = relationship(
        "ItemReserva",
        back_populates="reserva",
        cascade="all, delete-orphan",
    )


class ItemReserva(Base):
    __tablename__ = "items_reserva"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reserva_id: Mapped[int] = mapped_column(ForeignKey("dbo.reservas.id"), nullable=False)
    variante_producto_id: Mapped[int] = mapped_column(
        ForeignKey("dbo.variantes_producto.id"),
        nullable=False,
    )
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    reserva: Mapped[Reserva] = relationship("Reserva", back_populates="items")
    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto")

