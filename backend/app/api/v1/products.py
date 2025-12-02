from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductListResponse, ProductResponse, VariantResponse
from app.services.product_service import ProductService

router = APIRouter()


def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db=db)


@router.get("", response_model=ProductListResponse)
def list_products_endpoint(
    q: Optional[str] = None,
    brand_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    service: ProductService = Depends(get_product_service),
):
    """Lista productos con filtros y paginación."""
    try:
        return service.list_products(q, brand_id, category_id, status, page, page_size)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in list_products_endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al cargar productos: {str(e)}")


@router.get("/{slug}", response_model=ProductResponse)
def get_product_by_slug_endpoint(
    slug: str,
    service: ProductService = Depends(get_product_service),
):
    """Obtiene un producto por slug."""
    product = service.get_product_by_slug(slug)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.get("/by-id/{product_id}", response_model=ProductResponse)
def get_product_by_id_endpoint(
    product_id: int,
    service: ProductService = Depends(get_product_service),
):
    """Obtiene un producto por ID (endpoint temporal para migración)."""
    product = service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


@router.get("/{slug}/variants", response_model=list[VariantResponse])
def get_product_variants(
    slug: str,
    service: ProductService = Depends(get_product_service),
):
    """Lista las variantes de un producto por slug."""
    variants = service.list_variants_by_slug(slug)
    if variants is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return variants
