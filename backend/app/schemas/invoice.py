from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class InvoiceItemResponse(BaseModel):
    id: int
    variante_producto_id: int
    variante_nombre: Optional[str] = None
    cantidad: float
    precio_unitario: float
    descuento: float
    subtotal: float

    class Config:
        from_attributes = True


class InvoiceCustomer(BaseModel):
    id: int
    nombre: str
    nit_ci: Optional[str] = None

    class Config:
        from_attributes = True


class InvoiceUser(BaseModel):
    id: int
    nombre_usuario: str

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: int
    numero_factura: str
    orden_venta_id: Optional[int] = None
    cliente_id: int
    cliente: Optional[InvoiceCustomer] = None
    usuario_id: Optional[int] = None
    usuario: Optional[InvoiceUser] = None
    nit_cliente: Optional[str] = None
    razon_social: Optional[str] = None
    fecha_emision: datetime
    fecha_vencimiento: Optional[datetime] = None
    subtotal: float
    descuento: float
    impuesto: float
    total: float
    estado: str
    items: List[InvoiceItemResponse]

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    items: List[InvoiceResponse]
    total: int
    page: int
    page_size: int


class InvoiceCreateRequest(BaseModel):
    orden_venta_id: Optional[int] = None
    cliente_id: int
    nit_cliente: Optional[str] = None
    razon_social: Optional[str] = None
    fecha_vencimiento: Optional[datetime] = None
    items: List[dict]  # Lista de items con variante_producto_id, cantidad, precio_unitario, descuento


class InvoiceItemCreateRequest(BaseModel):
    variante_producto_id: int
    cantidad: float
    precio_unitario: float
    descuento: float = 0.0

