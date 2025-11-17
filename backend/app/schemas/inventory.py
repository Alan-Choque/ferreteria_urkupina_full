from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, model_validator


class StockEntry(BaseModel):
    variante_id: int
    almacen_id: int
    almacen_nombre: str
    cantidad_disponible: float
    costo_promedio: float | None = None

    class Config:
        from_attributes = True


class StockSummary(BaseModel):
    producto_id: int
    producto_nombre: str
    variante_id: int
    variante_nombre: Optional[str] = None
    unidad_medida: Optional[str] = None
    almacen_id: int
    almacen_nombre: str
    cantidad_disponible: float
    costo_promedio: Optional[float] = None

    class Config:
        from_attributes = True


class WarehouseResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


class InventoryEntryItem(BaseModel):
    variante_id: int
    cantidad: float = Field(gt=0, description="Cantidad a ingresar (> 0)")
    costo_unitario: Optional[float] = Field(default=None, ge=0)


class InventoryEntryRequest(BaseModel):
    almacen_id: int
    descripcion: Optional[str] = Field(default=None, max_length=255)
    items: list[InventoryEntryItem]

    @model_validator(mode="after")
    def _ensure_items(cls, values: "InventoryEntryRequest"):
        if not values.items:
            raise ValueError("Debes registrar al menos un ítem en el ingreso.")
        return values


class InventoryTransferItem(BaseModel):
    variante_id: int
    cantidad: float = Field(gt=0, description="Cantidad a transferir (> 0)")


class InventoryTransferRequest(BaseModel):
    almacen_origen_id: int
    almacen_destino_id: int
    descripcion: Optional[str] = Field(default=None, max_length=255)
    items: list[InventoryTransferItem]

    @model_validator(mode="after")
    def _validate_transfer(cls, values: "InventoryTransferRequest"):
        if values.almacen_origen_id == values.almacen_destino_id:
            raise ValueError("El almacén de origen y destino deben ser distintos.")
        if not values.items:
            raise ValueError("Debes registrar al menos un ítem en la transferencia.")
        return values


class InventoryAdjustmentItem(BaseModel):
    variante_id: int
    almacen_id: int
    cantidad_nueva: float = Field(ge=0, description="Cantidad final en el almacén (>= 0)")


class InventoryAdjustmentRequest(BaseModel):
    descripcion: Optional[str] = Field(default=None, max_length=255)
    items: list[InventoryAdjustmentItem]

    @model_validator(mode="after")
    def _ensure_items(cls, values: "InventoryAdjustmentRequest"):
        if not values.items:
            raise ValueError("Debes registrar al menos un ítem en el ajuste.")
        return values


class InventoryOperationResult(BaseModel):
    message: str
    updated_stock: list[StockEntry]


class VariantStockOverview(BaseModel):
    almacen_id: int
    almacen_nombre: str
    cantidad_disponible: float


class VariantSearchItem(BaseModel):
    id: int
    producto_id: int
    producto_nombre: str
    variante_nombre: Optional[str] = None
    unidad_medida: Optional[str] = None
    total_stock: float
    stock_detalle: list[VariantStockOverview] = Field(default_factory=list)


VariantSearchResponse = list[VariantSearchItem]
