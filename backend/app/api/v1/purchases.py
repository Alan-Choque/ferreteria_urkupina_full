from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.purchase import PurchaseOrderListResponse, PurchaseOrderResponse
from app.services.purchase_service import PurchaseService

router = APIRouter()


def get_purchase_service(db: Session = Depends(get_db)) -> PurchaseService:
    return PurchaseService(db=db)


@router.get("", response_model=PurchaseOrderListResponse)
def list_purchase_orders(
    supplier_id: Optional[int] = None,
    estado: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_orders(supplier_id=supplier_id, estado=estado, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(
    order_id: int,
    service: PurchaseService = Depends(get_purchase_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_order(order_id)

