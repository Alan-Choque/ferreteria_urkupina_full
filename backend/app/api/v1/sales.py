from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.sale import SaleOrderListResponse, SaleOrderResponse
from app.services.sale_service import SaleService

router = APIRouter()


def get_sale_service(db: Session = Depends(get_db)) -> SaleService:
    return SaleService(db=db)


@router.get("", response_model=SaleOrderListResponse)
def list_sales_orders(
    customer_id: Optional[int] = None,
    estado: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: SaleService = Depends(get_sale_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_orders(customer_id=customer_id, estado=estado, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=SaleOrderResponse)
def get_sales_order(
    order_id: int,
    service: SaleService = Depends(get_sale_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_order(order_id)

