from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey
from app.db.base import Base


class Categoria(Base):
    __tablename__ = "categorias"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    productos: Mapped[list["Producto"]] = relationship("Producto", back_populates="categoria")


class CierreCategoria(Base):
    __tablename__ = "cierre_categoria"
    __table_args__ = {"schema": "dbo"}
    
    categoria_id: Mapped[int] = mapped_column(ForeignKey("dbo.categorias.id"), primary_key=True)
    categoria_ancestro_id: Mapped[int] = mapped_column(ForeignKey("dbo.categorias.id"), primary_key=True)
    nivel: Mapped[int] = mapped_column(Integer, nullable=False)
