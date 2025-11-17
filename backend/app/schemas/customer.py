from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class CustomerBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    nit_ci: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    correo: Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=255)


class CustomerCreateRequest(CustomerBase):
    pass


class CustomerUpdateRequest(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    nit_ci: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    correo: Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=255)


class CustomerResponse(CustomerBase):
    id: int
    fecha_registro: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    page_size: int

