from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:  # pragma: no cover
    from app.models.variante_producto import VarianteProducto


class Atributo(Base):
    __tablename__ = "atributos"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    valores: Mapped[list["ValorAtributo"]] = relationship(
        "ValorAtributo",
        back_populates="atributo",
        cascade="all, delete-orphan",
    )
    valores_variantes: Mapped[list["ValorAtributoVariante"]] = relationship(
        "ValorAtributoVariante",
        back_populates="atributo",
        cascade="all, delete-orphan",
    )


class ValorAtributo(Base):
    __tablename__ = "valores_atributos"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    atributo_id: Mapped[int] = mapped_column(ForeignKey("dbo.atributos.id"), nullable=False)
    valor: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    atributo: Mapped[Atributo] = relationship("Atributo", back_populates="valores")


class ValorAtributoVariante(Base):
    __tablename__ = "valores_atributo_variante"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    variante_id: Mapped[int] = mapped_column(ForeignKey("dbo.variantes_producto.id"), nullable=False)
    atributo_id: Mapped[int] = mapped_column(ForeignKey("dbo.atributos.id"), nullable=False)
    valor: Mapped[str] = mapped_column(String(100), nullable=False)

    atributo: Mapped[Atributo] = relationship("Atributo", back_populates="valores_variantes")
    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto", back_populates="valores_atributos")
