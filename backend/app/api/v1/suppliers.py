from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.supplier import (
    SupplierCreateRequest,
    SupplierListResponse,
    SupplierResponse,
    SupplierUpdateRequest,
)
from app.services.supplier_service import SupplierService

router = APIRouter()


def get_supplier_service(db: Session = Depends(get_db)) -> SupplierService:
    return SupplierService(db=db)


@router.get("", response_model=SupplierListResponse)
def list_suppliers(
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_suppliers(q=q, page=page, page_size=page_size)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_supplier(supplier_id)


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: SupplierCreateRequest,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.create_supplier(payload)


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdateRequest,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.update_supplier(supplier_id, payload)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    service.delete_supplier(supplier_id)

