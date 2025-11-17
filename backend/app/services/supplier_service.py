from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.supplier_repo import SupplierFilter, SupplierRepository
from app.schemas.supplier import (
    SupplierCreateRequest,
    SupplierListResponse,
    SupplierResponse,
    SupplierUpdateRequest,
)


@dataclass(slots=True)
class SupplierService:
    db: Session
    _repo: SupplierRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = SupplierRepository(self.db)

    def list_suppliers(
        self,
        *,
        q: Optional[str],
        page: int,
        page_size: int,
    ) -> SupplierListResponse:
        filters = SupplierFilter(search=q)
        suppliers, total = self._repo.list(filters, page, page_size)
        items = [SupplierResponse.model_validate(s) for s in suppliers]
        return SupplierListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_supplier(self, supplier_id: int) -> SupplierResponse:
        supplier = self._repo.get(supplier_id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
        return SupplierResponse.model_validate(supplier)

    def create_supplier(self, payload: SupplierCreateRequest) -> SupplierResponse:
        supplier = self._repo.create(payload.model_dump())
        return SupplierResponse.model_validate(supplier)

    def update_supplier(self, supplier_id: int, payload: SupplierUpdateRequest) -> SupplierResponse:
        supplier = self._repo.get(supplier_id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
        data = {k: v for k, v in payload.model_dump().items() if v is not None}
        if not data:
            return SupplierResponse.model_validate(supplier)
        supplier = self._repo.update(supplier, data)
        return SupplierResponse.model_validate(supplier)

    def delete_supplier(self, supplier_id: int) -> None:
        supplier = self._repo.get(supplier_id)
        if not supplier:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
        if supplier.ordenes_compra:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El proveedor tiene órdenes de compra asociadas",
            )
        self._repo.delete(supplier)

