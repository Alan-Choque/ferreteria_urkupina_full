from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class SaleCustomer(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class SaleUser(BaseModel):
    id: int
    nombre_usuario: str

    class Config:
        from_attributes = True


class SaleItemResponse(BaseModel):
    id: int
    variante_producto_id: int
    variante_nombre: Optional[str] = None
    cantidad: float
    precio_unitario: Optional[float] = None


class SaleOrderResponse(BaseModel):
    id: int
    fecha: datetime
    estado: str
    cliente: Optional[SaleCustomer] = None
    usuario: Optional[SaleUser] = None
    items: List[SaleItemResponse]
    total: float


class SaleOrderListResponse(BaseModel):
    items: List[SaleOrderResponse]
    total: int
    page: int
    page_size: int

