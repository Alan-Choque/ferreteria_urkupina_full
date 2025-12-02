from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class PaymentCustomer(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class PaymentUser(BaseModel):
    id: int
    nombre_usuario: str

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    cliente_id: int
    cliente: Optional[PaymentCustomer] = None
    factura_id: Optional[int] = None
    orden_venta_id: Optional[int] = None
    usuario_id: Optional[int] = None
    usuario: Optional[PaymentUser] = None
    monto: float
    metodo_pago: str
    numero_comprobante: Optional[str] = None
    fecha_pago: datetime
    fecha_registro: datetime
    observaciones: Optional[str] = None
    estado: str

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    page: int
    page_size: int


class PaymentCreateRequest(BaseModel):
    cliente_id: int
    factura_id: Optional[int] = None
    orden_venta_id: Optional[int] = None
    monto: float
    metodo_pago: str  # EFECTIVO, TRANSFERENCIA, CHEQUE, TARJETA
    numero_comprobante: Optional[str] = None
    fecha_pago: Optional[datetime] = None  # Si no se proporciona, usa la fecha actual
    observaciones: Optional[str] = None
    estado: str = "CONFIRMADO"

