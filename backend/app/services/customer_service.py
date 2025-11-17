from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.customer_repo import CustomerFilter, CustomerRepository
from app.schemas.customer import (
    CustomerCreateRequest,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdateRequest,
)


@dataclass(slots=True)
class CustomerService:
    db: Session
    _repo: CustomerRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = CustomerRepository(self.db)

    def list_customers(
        self,
        *,
        q: Optional[str],
        page: int,
        page_size: int,
    ) -> CustomerListResponse:
        filters = CustomerFilter(search=q)
        customers, total = self._repo.list(filters, page, page_size)
        items = [CustomerResponse.model_validate(c) for c in customers]
        return CustomerListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_customer(self, customer_id: int) -> CustomerResponse:
        customer = self._repo.get(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        return CustomerResponse.model_validate(customer)

    def create_customer(self, payload: CustomerCreateRequest) -> CustomerResponse:
        customer = self._repo.create(payload.model_dump())
        return CustomerResponse.model_validate(customer)

    def update_customer(self, customer_id: int, payload: CustomerUpdateRequest) -> CustomerResponse:
        customer = self._repo.get(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        data = {k: v for k, v in payload.model_dump().items() if v is not None}
        if not data:
            return CustomerResponse.model_validate(customer)
        customer = self._repo.update(customer, data)
        return CustomerResponse.model_validate(customer)

    def delete_customer(self, customer_id: int) -> None:
        customer = self._repo.get(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        try:
            self._repo.delete(customer)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

