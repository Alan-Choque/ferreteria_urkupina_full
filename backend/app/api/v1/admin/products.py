from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.product import (
    ProductCreateRequest,
    ProductListResponse,
    ProductMetaResponse,
    ProductResponse,
    ProductStatusUpdateRequest,
    ProductUpdateRequest,
)
from app.services.product_service import ProductService

router = APIRouter()


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db=db)


@router.get("", response_model=ProductListResponse)
def list_products_admin(
    q: Optional[str] = None,
    brand_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    service: ProductService = Depends(get_product_service),
    _: None = Depends(require_role("ADMIN")),
):
    """Listado administrativo de productos."""
    return service.list_products(q, brand_id, category_id, status_filter, page, page_size)


@router.get("/meta", response_model=ProductMetaResponse)
def fetch_products_meta(
    service: ProductService = Depends(get_product_service),
    _: None = Depends(require_role("ADMIN")),
):
    """Obtiene catálogos auxiliares para formularios (marcas, categorías, unidades)."""
    return service.fetch_meta()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product_admin(
    payload: ProductCreateRequest,
    service: ProductService = Depends(get_product_service),
    _: None = Depends(require_role("ADMIN")),
):
    """Crea un nuevo producto con variantes e imágenes."""
    try:
        return service.create_product(payload)
    except ValueError as exc:  # Validation at service level
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{product_id}", response_model=ProductResponse)
def get_product_admin(
    product_id: int,
    service: ProductService = Depends(get_product_service),
    _: None = Depends(require_role("ADMIN")),
):
    producto = service.get_product_by_id(product_id)
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return producto


@router.put("/{product_id}", response_model=ProductResponse)
def update_product_admin(
    product_id: int,
    payload: ProductUpdateRequest,
    service: ProductService = Depends(get_product_service),
    _: None = Depends(require_role("ADMIN")),
):
    try:
        return service.update_product(product_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{product_id}/status", response_model=ProductResponse)
def change_product_status_admin(
    product_id: int,
    payload: ProductStatusUpdateRequest,
    service: ProductService = Depends(get_product_service),
    _: None = Depends(require_role("ADMIN")),
):
    try:
        return service.set_product_status(product_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
