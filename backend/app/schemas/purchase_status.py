from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class PurchaseItemRequest(BaseModel):
    variante_producto_id: int
    cantidad: float
    precio_unitario: Optional[float] = None


class PurchaseOrderCreateRequest(BaseModel):
    proveedor_id: int
    items: List[PurchaseItemRequest]
    observaciones: Optional[str] = None


class PurchaseOrderUpdateRequest(BaseModel):
    proveedor_id: Optional[int] = None
    items: Optional[List[PurchaseItemRequest]] = None
    observaciones: Optional[str] = None


class PurchaseSendRequest(BaseModel):
    observaciones: Optional[str] = None


class PurchaseConfirmRequest(BaseModel):
    items: Optional[List[PurchaseItemRequest]] = None  # Proveedor puede actualizar precios/cantidades
    observaciones: Optional[str] = None


class PurchaseRejectRequest(BaseModel):
    motivo: str


class PurchaseReceiveRequest(BaseModel):
    items: List[PurchaseItemRequest]  # Cantidades realmente recibidas
    observaciones: Optional[str] = None


class PurchaseInvoiceRequest(BaseModel):
    numero_factura_proveedor: str
    observaciones: Optional[str] = None


class PurchaseCloseRequest(BaseModel):
    observaciones: Optional[str] = None

