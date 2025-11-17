from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ReservationCustomer(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class ReservationUser(BaseModel):
    id: int
    nombre_usuario: str

    class Config:
        from_attributes = True


class ReservationItemResponse(BaseModel):
    id: int
    variante_producto_id: int
    variante_nombre: Optional[str] = None
    cantidad: float


class ReservationResponse(BaseModel):
    id: int
    fecha_reserva: Optional[datetime] = None
    estado: str
    cliente: Optional[ReservationCustomer] = None
    usuario: Optional[ReservationUser] = None
    items: List[ReservationItemResponse]


class ReservationListResponse(BaseModel):
    items: List[ReservationResponse]
    total: int
    page: int
    page_size: int

