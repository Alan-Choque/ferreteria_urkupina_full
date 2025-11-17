from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.models.usuario import Usuario
from app.schemas.inventory import (
    InventoryAdjustmentRequest,
    InventoryEntryRequest,
    InventoryOperationResult,
    InventoryTransferRequest,
    StockEntry,
    StockSummary,
    VariantSearchItem,
    WarehouseResponse,
)
from app.services.inventory_service import InventoryService

router = APIRouter()


def get_inventory_service(db: Session = Depends(get_db)) -> InventoryService:
    return InventoryService(db=db)


@router.get("/stock/{variant_id}", response_model=list[StockEntry])
def get_stock_by_variant(
    variant_id: int,
    service: InventoryService = Depends(get_inventory_service),
):
    """Obtiene el stock de una variante en todos los almacenes."""
    try:
        stock = service.stock_by_variant(variant_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return stock


@router.get("/stock", response_model=list[StockSummary])
def get_stock_summary(
    service: InventoryService = Depends(get_inventory_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Lista el stock consolidado por producto/variante y almacén."""
    return service.list_stock_summary()


@router.get("/warehouses", response_model=list[WarehouseResponse])
def list_warehouses(
    service: InventoryService = Depends(get_inventory_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Obtiene la lista de almacenes disponibles."""
    return service.list_warehouses()


@router.get("/variants/search", response_model=list[VariantSearchItem])
def search_variants(
    q: str = Query(..., min_length=2, description="Texto de búsqueda (nombre de producto o variante)"),
    limit: int = Query(20, ge=1, le=100),
    service: InventoryService = Depends(get_inventory_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Busca variantes de producto para operaciones de inventario."""
    return service.search_variants(q, limit=limit)


@router.post("/entries", response_model=InventoryOperationResult, status_code=status.HTTP_201_CREATED)
def register_inventory_entry(
    payload: InventoryEntryRequest,
    service: InventoryService = Depends(get_inventory_service),
    current_user: Usuario = Depends(require_role("ADMIN")),
):
    """Registra ingresos manuales de inventario."""
    return service.register_entry(payload, getattr(current_user, "id", None))


@router.post("/transfers", response_model=InventoryOperationResult, status_code=status.HTTP_201_CREATED)
def transfer_inventory(
    payload: InventoryTransferRequest,
    service: InventoryService = Depends(get_inventory_service),
    current_user: Usuario = Depends(require_role("ADMIN")),
):
    """Registra transferencias de stock entre almacenes."""
    return service.transfer_stock(payload, getattr(current_user, "id", None))


@router.post("/adjustments", response_model=InventoryOperationResult, status_code=status.HTTP_201_CREATED)
def adjust_inventory(
    payload: InventoryAdjustmentRequest,
    service: InventoryService = Depends(get_inventory_service),
    current_user: Usuario = Depends(require_role("ADMIN")),
):
    """Realiza ajustes de inventario a partir de conteos físicos u otros eventos."""
    return service.adjust_stock(payload, getattr(current_user, "id", None))
