from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class ContactoProveedorBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    cargo: Optional[str] = Field(None, max_length=50)
    telefono: Optional[str] = Field(None, max_length=20)
    correo: Optional[EmailStr] = None
    observaciones: Optional[str] = Field(None, max_length=255)
    activo: bool = True


class ContactoProveedorCreateRequest(ContactoProveedorBase):
    proveedor_id: int


class ContactoProveedorUpdateRequest(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    cargo: Optional[str] = Field(None, max_length=50)
    telefono: Optional[str] = Field(None, max_length=20)
    correo: Optional[EmailStr] = None
    observaciones: Optional[str] = Field(None, max_length=255)
    activo: Optional[bool] = None


class ContactoProveedorResponse(ContactoProveedorBase):
    id: int
    proveedor_id: int

    class Config:
        from_attributes = True


class SupplierBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    nit_ci: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    correo: Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=255)
    activo: bool = True


class SupplierCreateRequest(SupplierBase):
    productos_ids: Optional[List[int]] = Field(default_factory=list)
    contactos: Optional[List[ContactoProveedorBase]] = Field(default_factory=list)


class SupplierUpdateRequest(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    nit_ci: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    correo: Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=255)
    activo: Optional[bool] = None
    productos_ids: Optional[List[int]] = None


class SupplierProductResponse(BaseModel):
    id: int
    nombre: str
    categoria: Optional[str] = None

    class Config:
        from_attributes = True


class SupplierResponse(SupplierBase):
    id: int
    fecha_registro: datetime
    productos: Optional[List[SupplierProductResponse]] = None
    contactos: Optional[List[ContactoProveedorResponse]] = None

    class Config:
        from_attributes = True


class SupplierListResponse(BaseModel):
    items: List[SupplierResponse]
    total: int
    page: int
    page_size: int

