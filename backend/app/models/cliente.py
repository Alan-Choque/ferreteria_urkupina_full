from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.factura import FacturaVenta
    from app.models.pago import PagoCliente


class Cliente(Base):
    __tablename__ = "clientes"
    __table_args__ = (
        Index("ix_clientes_correo", "correo"),  # Índice para búsquedas por email
        Index("ix_clientes_usuario_id", "usuario_id"),  # Índice para búsquedas por usuario
        {"schema": "dbo"}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    nit_ci: Mapped[str | None] = mapped_column(String(20), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    correo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    # Relación opcional con Usuario: un cliente puede tener máximo un usuario asociado
    # Si es NULL, es un cliente invitado (sin cuenta)
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("dbo.usuarios.id"),
        nullable=True,
        unique=True,  # Un usuario solo puede tener UN cliente asociado
    )

    # Relationships
    usuario: Mapped["Usuario | None"] = relationship(
        "Usuario",
        back_populates="cliente",
        foreign_keys=[usuario_id],
    )
    ordenes_venta: Mapped[List["OrdenVenta"]] = relationship(
        "OrdenVenta",
        back_populates="cliente",
    )
    reservas: Mapped[List["Reserva"]] = relationship(
        "Reserva",
        back_populates="cliente",
    )
    facturas: Mapped[List["FacturaVenta"]] = relationship(
        "FacturaVenta",
        back_populates="cliente",
    )
    pagos: Mapped[List["PagoCliente"]] = relationship(
        "PagoCliente",
        back_populates="cliente",
    )
