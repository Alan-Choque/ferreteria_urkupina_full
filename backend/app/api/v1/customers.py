from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.customer import (
    CustomerCreateRequest,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdateRequest,
)
from app.services.customer_service import CustomerService

router = APIRouter()


def get_customer_service(db: Session = Depends(get_db)) -> CustomerService:
    return CustomerService(db=db)


@router.get("", response_model=CustomerListResponse)
def list_customers(
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_customers(q=q, page=page, page_size=page_size)


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_customer(customer_id)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreateRequest,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.create_customer(payload)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdateRequest,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.update_customer(customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    service: CustomerService = Depends(get_customer_service),
    _: object = Depends(require_role("ADMIN")),
):
    service.delete_customer(customer_id)

