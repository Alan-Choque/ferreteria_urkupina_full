from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey
from app.db.base import Base


if TYPE_CHECKING:  # pragma: no cover
    from app.models.atributo import ValorAtributoVariante
    from app.models.producto_almacen import ProductoAlmacen
    from app.models.producto import Producto


class VarianteProducto(Base):
    __tablename__ = "variantes_producto"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("dbo.productos.id"), nullable=False)
    nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unidad_medida_id: Mapped[int] = mapped_column(ForeignKey("dbo.unidades_medida.id"), nullable=False)
    precio: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    producto: Mapped["Producto"] = relationship("Producto", back_populates="variantes")
    unidad_medida: Mapped["UnidadMedida"] = relationship("UnidadMedida", back_populates="variantes")
    stock_almacenes: Mapped[list["ProductoAlmacen"]] = relationship("ProductoAlmacen", back_populates="variante")
    valores_atributos: Mapped[list["ValorAtributoVariante"]] = relationship(
        "ValorAtributoVariante",
        back_populates="variante",
        cascade="all, delete-orphan",
    )


class UnidadMedida(Base):
    __tablename__ = "unidades_medida"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    simbolo: Mapped[str | None] = mapped_column(String(10), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    variantes: Mapped[list["VarianteProducto"]] = relationship("VarianteProducto", back_populates="unidad_medida")
