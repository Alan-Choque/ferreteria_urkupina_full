from datetime import datetime
from typing import List

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Promocion(Base):
    __tablename__ = "promociones"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_inicio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=True, default=True)

    reglas: Mapped[List["ReglaPromocion"]] = relationship(
        "ReglaPromocion",
        back_populates="promocion",
        cascade="all, delete-orphan",
    )


class ReglaPromocion(Base):
    __tablename__ = "reglas_promocion"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    promocion_id: Mapped[int] = mapped_column(ForeignKey("dbo.promociones.id"), nullable=False)
    tipo_regla: Mapped[str] = mapped_column(String(10), nullable=False)
    valor: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)

    promocion: Mapped[Promocion] = relationship("Promocion", back_populates="reglas")

