from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class PurchaseSupplier(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class PurchaseUser(BaseModel):
    id: int
    nombre_usuario: str

    class Config:
        from_attributes = True


class PurchaseItemResponse(BaseModel):
    id: int
    variante_producto_id: int
    variante_nombre: Optional[str] = None
    cantidad: float
    precio_unitario: Optional[float] = None


class PurchaseOrderResponse(BaseModel):
    id: int
    fecha: datetime
    estado: str
    proveedor: Optional[PurchaseSupplier] = None
    usuario: Optional[PurchaseUser] = None
    items: List[PurchaseItemResponse]
    total: float
    fecha_envio: Optional[datetime] = None
    fecha_confirmacion: Optional[datetime] = None
    fecha_recepcion: Optional[datetime] = None
    fecha_facturacion: Optional[datetime] = None
    fecha_cierre: Optional[datetime] = None
    numero_factura_proveedor: Optional[str] = None
    observaciones: Optional[str] = None


class PurchaseOrderListResponse(BaseModel):
    items: List[PurchaseOrderResponse]
    total: int
    page: int
    page_size: int

