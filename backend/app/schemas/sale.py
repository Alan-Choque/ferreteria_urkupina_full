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
    metodo_pago: Optional[str] = None
    fecha_pago: Optional[datetime] = None
    fecha_preparacion: Optional[datetime] = None
    fecha_envio: Optional[datetime] = None
    fecha_entrega: Optional[datetime] = None
    direccion_entrega: Optional[str] = None
    persona_recibe: Optional[str] = None
    observaciones_entrega: Optional[str] = None
    cliente: Optional[SaleCustomer] = None
    usuario: Optional[SaleUser] = None
    items: List[SaleItemResponse]
    total: float

    class Config:
        from_attributes = True


class SaleOrderListResponse(BaseModel):
    items: List[SaleOrderResponse]
    total: int
    page: int
    page_size: int


class SaleItemCreateRequest(BaseModel):
    variante_producto_id: int
    cantidad: float
    precio_unitario: Optional[float] = None


class SaleOrderCreateRequest(BaseModel):
    cliente_id: Optional[int] = None  # Si no se proporciona, se busca por email o se crea
    cliente_email: Optional[str] = None  # Email del cliente (si no hay cliente_id)
    cliente_nombre: Optional[str] = None  # Nombre del cliente (si se crea nuevo)
    cliente_nit_ci: Optional[str] = None
    cliente_telefono: Optional[str] = None
    items: List[SaleItemCreateRequest]
    estado: str = "PENDIENTE"  # Por defecto PENDIENTE
    metodo_pago: Optional[str] = None  # PREPAGO, CONTRA_ENTREGA, RECOGER_EN_TIENDA, CREDITO
    direccion_entrega: Optional[str] = None  # Solo si es envío a domicilio
    sucursal_recogida_id: Optional[int] = None  # Solo si recoge en tienda

