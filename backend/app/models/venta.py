from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.almacen import Sucursal


class OrdenVenta(Base):
    __tablename__ = "ordenes_venta"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("dbo.clientes.id"), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)
    
    # Método de pago/entrega
    metodo_pago: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # PREPAGO, CONTRA_ENTREGA, RECOGER_EN_TIENDA, CREDITO
    
    # Fechas de eventos
    fecha_pago: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_preparacion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_envio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_entrega: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Información de entrega/recogida
    direccion_entrega: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Solo si es envío a domicilio
    sucursal_recogida_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.sucursales.id"), nullable=True)  # Solo si recoge en tienda
    persona_recibe: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Quién recibió/recogió
    repartidor_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)  # Empleado que entregó/atendió
    observaciones_entrega: Mapped[str | None] = mapped_column(Text, nullable=True)

    cliente: Mapped["Cliente"] = relationship("Cliente", back_populates="ordenes_venta")
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="ordenes_venta", foreign_keys=[usuario_id])
    repartidor: Mapped["Usuario | None"] = relationship("Usuario", foreign_keys=[repartidor_id])
    sucursal_recogida: Mapped["Sucursal | None"] = relationship("Sucursal")
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

