from datetime import datetime
from typing import List

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


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

    ordenes_compra: Mapped[List["OrdenCompra"]] = relationship(
        "OrdenCompra",
        back_populates="proveedor",
    )
