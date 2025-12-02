from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cliente import Cliente
    from app.models.factura import FacturaVenta
    from app.models.venta import OrdenVenta
    from app.models.usuario import Usuario


class PagoCliente(Base):
    """Pagos realizados por clientes (para créditos y pagos a plazos)"""
    __tablename__ = "pagos_cliente"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Relaciones
    cliente_id: Mapped[int] = mapped_column(ForeignKey("dbo.clientes.id"), nullable=False)
    factura_id: Mapped[int | None] = mapped_column(
        ForeignKey("dbo.facturas_venta.id"), 
        nullable=True
    )
    orden_venta_id: Mapped[int | None] = mapped_column(
        ForeignKey("dbo.ordenes_venta.id"), 
        nullable=True
    )
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)
    
    # Monto y método
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    metodo_pago: Mapped[str] = mapped_column(String(50), nullable=False)  # EFECTIVO, TRANSFERENCIA, CHEQUE, TARJETA
    numero_comprobante: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Número de cheque, transferencia, etc.
    
    # Fechas
    fecha_pago: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Observaciones
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Estado
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="CONFIRMADO")  # CONFIRMADO, PENDIENTE, ANULADO
    
    # Relaciones
    cliente: Mapped["Cliente"] = relationship("Cliente", back_populates="pagos")
    factura: Mapped["FacturaVenta | None"] = relationship("FacturaVenta", back_populates="pagos")
    orden_venta: Mapped["OrdenVenta | None"] = relationship("OrdenVenta")
    usuario: Mapped["Usuario | None"] = relationship("Usuario")

