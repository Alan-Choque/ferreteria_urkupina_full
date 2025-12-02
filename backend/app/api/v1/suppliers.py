from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.supplier import (
    ContactoProveedorCreateRequest,
    ContactoProveedorResponse,
    ContactoProveedorUpdateRequest,
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
    _: object = Depends(require_role("ADMIN", "INVENTARIOS", "VENTAS")),
):
    """Lista todos los proveedores. Disponible para ADMIN, INVENTARIOS y VENTAS."""
    return service.list_suppliers(q=q, page=page, page_size=page_size)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN", "INVENTARIOS", "VENTAS")),
):
    """Obtiene un proveedor por ID. Disponible para ADMIN, INVENTARIOS y VENTAS."""
    return service.get_supplier(supplier_id)


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: SupplierCreateRequest,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Crea un nuevo proveedor con productos asociados y contactos. Solo ADMIN."""
    return service.create_supplier(payload)


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdateRequest,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Actualiza un proveedor. Solo ADMIN."""
    return service.update_supplier(supplier_id, payload)


@router.patch("/{supplier_id}/activate", response_model=SupplierResponse)
def activate_supplier(
    supplier_id: int,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Activa un proveedor. Solo ADMIN."""
    return service.activate_supplier(supplier_id)


@router.patch("/{supplier_id}/deactivate", response_model=SupplierResponse)
def deactivate_supplier(
    supplier_id: int,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Desactiva un proveedor. Solo ADMIN."""
    return service.deactivate_supplier(supplier_id)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Elimina un proveedor. Solo ADMIN."""
    service.delete_supplier(supplier_id)


# Endpoints para contactos
@router.post("/{supplier_id}/contacts", response_model=ContactoProveedorResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    supplier_id: int,
    payload: ContactoProveedorCreateRequest,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Crea un contacto para un proveedor. Solo ADMIN."""
    if payload.proveedor_id != supplier_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El proveedor_id no coincide")
    return service.create_contact(payload)


@router.put("/contacts/{contact_id}", response_model=ContactoProveedorResponse)
def update_contact(
    contact_id: int,
    payload: ContactoProveedorUpdateRequest,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Actualiza un contacto. Solo ADMIN."""
    return service.update_contact(contact_id, payload)


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN")),
):
    """Elimina un contacto. Solo ADMIN."""
    service.delete_contact(contact_id)


# Endpoints para reportes
@router.get("/reports/summary")
def get_suppliers_report(
    service: SupplierService = Depends(get_supplier_service),
    _: object = Depends(require_role("ADMIN", "INVENTARIOS", "VENTAS")),
):
    """Genera un reporte resumen de proveedores."""
    return service.get_suppliers_report()

