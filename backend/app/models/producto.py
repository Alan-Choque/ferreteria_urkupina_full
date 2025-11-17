from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey
from app.db.base import Base


if TYPE_CHECKING:  # pragma: no cover
    from app.models.categoria import Categoria
    from app.models.marca import Marca
    from app.models.variante_producto import VarianteProducto
    from app.models.imagen_producto import ImagenProducto


class Producto(Base):
    __tablename__ = "productos"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    categoria_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.categorias.id"), nullable=True)
    marca_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.marcas.id"), nullable=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    categoria: Mapped["Categoria | None"] = relationship("Categoria", back_populates="productos")
    marca: Mapped["Marca | None"] = relationship("Marca", back_populates="productos")
    variantes: Mapped[list["VarianteProducto"]] = relationship(
        "VarianteProducto",
        back_populates="producto",
        cascade="all, delete-orphan",
        order_by="VarianteProducto.id",
    )
    imagenes: Mapped[list["ImagenProducto"]] = relationship(
        "ImagenProducto",
        back_populates="producto",
        cascade="all, delete-orphan",
        order_by="ImagenProducto.id",
    )
