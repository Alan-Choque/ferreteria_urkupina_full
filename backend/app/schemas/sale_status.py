from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UpdateOrderStatusRequest(BaseModel):
    """Actualiza el estado de una orden"""
    estado: str  # PREPARANDO, ENVIADO, EN_ENVIO, LISTO_PARA_RECOGER, ENTREGADO, CANCELADO


class ShipOrderRequest(BaseModel):
    """Marca una orden como enviada"""
    repartidor_id: Optional[int] = None  # Empleado que envía
    direccion_entrega: Optional[str] = None  # Dirección de entrega (si no estaba)


class DeliverOrderRequest(BaseModel):
    """Marca una orden como entregada"""
    persona_recibe: str  # Quién recibió
    observaciones: Optional[str] = None
    # Pago contra entrega (solo si metodo_pago era CONTRA_ENTREGA)
    pago_contra_entrega: Optional[dict] = None
    # Ejemplo: {"monto": 500.00, "metodo_pago": "EFECTIVO"}


class ReadyForPickupRequest(BaseModel):
    """Marca una orden como lista para recoger"""
    pass  # No necesita datos adicionales


class PickupOrderRequest(BaseModel):
    """Marca una orden como recogida en tienda"""
    persona_recibe: str  # Quién recogió
    observaciones: Optional[str] = None
    # Pago al recoger (solo si no pagó antes)
    pago_al_recoger: Optional[dict] = None
    # Ejemplo: {"monto": 300.00, "metodo_pago": "EFECTIVO"}

