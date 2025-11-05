from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Numeric, DateTime, ForeignKey
from app.db.base import Base


class ProductoAlmacen(Base):
    __tablename__ = "producto_almacen"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    variante_producto_id: Mapped[int] = mapped_column(ForeignKey("dbo.variantes_producto.id"), nullable=False)
    almacen_id: Mapped[int] = mapped_column(ForeignKey("dbo.almacenes.id"), nullable=False)
    cantidad_disponible: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    costo_promedio: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    variante: Mapped["VarianteProducto"] = relationship("VarianteProducto", back_populates="stock_almacenes")
    almacen: Mapped["Almacen"] = relationship("Almacen", back_populates="stock")
