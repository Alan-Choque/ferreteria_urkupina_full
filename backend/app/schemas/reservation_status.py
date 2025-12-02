from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReservationCreateRequest(BaseModel):
    cliente_id: Optional[int] = None  # Si es None, se usa el cliente del usuario autenticado
    items: list[dict]  # [{"variante_producto_id": int, "cantidad": float}]
    fecha_reserva: Optional[datetime] = None
    observaciones: Optional[str] = None


class ReservationCancelRequest(BaseModel):
    motivo: Optional[str] = None


class ReservationDepositRequest(BaseModel):
    monto: float
    metodo_pago: str  # EFECTIVO, QR, TARJETA
    numero_comprobante: Optional[str] = None
    observaciones: Optional[str] = None


class ReservationConfirmRequest(BaseModel):
    enviar_recordatorio: bool = False
    fecha_recordatorio: Optional[datetime] = None
    observaciones: Optional[str] = None


class ReservationCompleteRequest(BaseModel):
    metodo_pago: str  # EFECTIVO, QR, TARJETA
    direccion_entrega: Optional[str] = None
    sucursal_recogida_id: Optional[int] = None
    observaciones: Optional[str] = None

