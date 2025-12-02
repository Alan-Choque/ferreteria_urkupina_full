from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cliente import Cliente
    from app.models.usuario import Usuario
    from app.models.venta import OrdenVenta
    from app.models.pago import PagoCliente
    from app.models.variante_producto import VarianteProducto


class FacturaVenta(Base):
    """Factura fiscal de venta (requisito legal en Bolivia)"""
    __tablename__ = "facturas_venta"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    numero_factura: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    orden_venta_id: Mapped[int | None] = mapped_column(
        ForeignKey("dbo.ordenes_venta.id"), 
        nullable=True
    )
    cliente_id: Mapped[int] = mapped_column(ForeignKey("dbo.clientes.id"), nullable=False)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)
    
    # Datos fiscales
    nit_cliente: Mapped[str | None] = mapped_column(String(20), nullable=True)
    razon_social: Mapped[str | None] = mapped_column(String(150), nullable=True)
    
    # Fechas
    fecha_emision: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_vencimiento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Totales
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    descuento: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    impuesto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    
    # Estado
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="EMITIDA")  # EMITIDA, ANULADA
    
    # Relaciones
    cliente: Mapped["Cliente"] = relationship("Cliente", back_populates="facturas")
    usuario: Mapped["Usuario | None"] = relationship("Usuario")
    orden_venta: Mapped["OrdenVenta | None"] = relationship("OrdenVenta")
    items: Mapped[List["ItemFacturaVenta"]] = relationship(
        "ItemFacturaVenta",
        back_populates="factura",
        cascade="all, delete-orphan",
    )
    pagos: Mapped[List["PagoCliente"]] = relationship(
        "PagoCliente",
        back_populates="factura",
    )


class ItemFacturaVenta(Base):
    """Items de una factura de venta"""
    __tablename__ = "items_factura_venta"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    factura_id: Mapped[int] = mapped_column(
        ForeignKey("dbo.facturas_venta.id"),
        nullable=False,
    )
    variante_producto_id: Mapped[int] = mapped_column(
        ForeignKey("dbo.variantes_producto.id"),
        nullable=False,
    )
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    precio_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    descuento: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    
    # Relaciones
    factura: Mapped[FacturaVenta] = relationship("FacturaVenta", back_populates="items")
    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto")

