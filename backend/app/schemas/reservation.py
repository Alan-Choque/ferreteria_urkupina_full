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
    # Campos de anticipio
    monto_anticipio: Optional[float] = None
    fecha_anticipio: Optional[datetime] = None
    metodo_pago_anticipio: Optional[str] = None
    numero_comprobante_anticipio: Optional[str] = None
    # Campos de confirmación
    fecha_confirmacion: Optional[datetime] = None
    fecha_recordatorio: Optional[datetime] = None
    # Campos de completado
    fecha_completado: Optional[datetime] = None
    orden_venta_id: Optional[int] = None
    # Observaciones
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True


class ReservationListResponse(BaseModel):
    items: List[ReservationResponse]
    total: int
    page: int
    page_size: int

