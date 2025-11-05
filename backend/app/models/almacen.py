from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey
from app.db.base import Base


class Almacen(Base):
    __tablename__ = "almacenes"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sucursal_id: Mapped[int] = mapped_column(ForeignKey("dbo.sucursales.id"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    sucursal: Mapped["Sucursal"] = relationship("Sucursal", back_populates="almacenes")
    stock: Mapped[list["ProductoAlmacen"]] = relationship("ProductoAlmacen", back_populates="almacen")


class Sucursal(Base):
    __tablename__ = "sucursales"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    empresa_id: Mapped[int] = mapped_column(ForeignKey("dbo.empresas.id"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    empresa: Mapped["Empresa"] = relationship("Empresa", back_populates="sucursales")
    almacenes: Mapped[list["Almacen"]] = relationship("Almacen", back_populates="sucursal")


class Empresa(Base):
    __tablename__ = "empresas"
    __table_args__ = {"schema": "dbo"}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    razon_social: Mapped[str | None] = mapped_column(String(150), nullable=True)
    nit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Relationships
    sucursales: Mapped[list["Sucursal"]] = relationship("Sucursal", back_populates="empresa")
