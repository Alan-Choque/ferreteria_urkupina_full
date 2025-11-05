from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.product_service import (
    list_products, get_product_by_slug, get_product_by_id,
    list_variants_by_slug, list_variants_by_product_id
)
from app.schemas.product import ProductListResponse, ProductResponse, VariantResponse

router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_products_endpoint(
    q: Optional[str] = None,
    brand_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Lista productos con filtros y paginación."""
    return list_products(db, q, brand_id, category_id, status, page, page_size)


@router.get("/{slug}", response_model=ProductResponse)
def get_product_by_slug_endpoint(slug: str, db: Session = Depends(get_db)):
    """Obtiene un producto por slug."""
    product = get_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.get("/by-id/{product_id}", response_model=ProductResponse)
def get_product_by_id_endpoint(product_id: int, db: Session = Depends(get_db)):
    """Obtiene un producto por ID (endpoint temporal para migración)."""
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.get("/{slug}/variants", response_model=list[VariantResponse])
def get_product_variants(slug: str, db: Session = Depends(get_db)):
    """Lista las variantes de un producto por slug."""
    variants = list_variants_by_slug(db, slug)
    if variants is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return variants
