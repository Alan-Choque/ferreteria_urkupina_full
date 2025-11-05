from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.product import Product
from app.models.brand import Brand
from app.models.category import Category
from app.models.variant import ProductVariant

def _min_price_subq():
    return (
        select(ProductVariant.product_id, func.min(ProductVariant.price).label("price"))
        .group_by(ProductVariant.product_id)
        .subquery()
    )

def list_products(db: Session, q: str | None, brand_id: int | None, category_id: int | None,
                  status: str | None, page: int, page_size: int) -> Tuple[list[dict], int]:
    mp = _min_price_subq()
    stmt = (
        select(
            Product.id, Product.sku, Product.name, Product.slug, Product.image, Product.short,
            Brand.name.label("brand"), Category.name.label("category"), mp.c.price
        )
        .join(Brand, Brand.id == Product.brand_id, isouter=True)
        .join(Category, Category.id == Product.category_id, isouter=True)
        .join(mp, mp.c.product_id == Product.id, isouter=True)
    )
    if q:
        like = f"%{q}%"
        stmt = stmt.where((Product.name.ilike(like)) | (Product.sku.ilike(like)))
    if brand_id:
        stmt = stmt.where(Product.brand_id == brand_id)
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if status:
        stmt = stmt.where(Product.status == status)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    stmt = stmt.order_by(Product.created_at.desc()).offset((page-1)*page_size).limit(page_size)
    rows = db.execute(stmt).all()
    items = [{
        "id": r.id, "sku": r.sku, "name": r.name, "slug": r.slug, "image": r.image, "short": r.short,
        "price": float(r.price) if r.price is not None else None, "brand": r.brand, "category": r.category
    } for r in rows]
    return items, total

def get_product_by_slug(db: Session, slug: str) -> dict | None:
    row = db.execute(
        select(Product, Brand.name.label("brand"), Category.name.label("category"))
        .join(Brand, Brand.id == Product.brand_id, isouter=True)
        .join(Category, Category.id == Product.category_id, isouter=True)
        .where(Product.slug == slug)
    ).first()
    if not row: return None
    p = row.Product
    return {
        "id": p.id, "sku": p.sku, "name": p.name, "slug": p.slug, "image": p.image, "short": p.short,
        "description": p.description, "status": p.status,
        "tax_rate": float(p.tax_rate) if p.tax_rate is not None else None,
        "brand": row.brand, "category": row.category
    }

def list_variants_by_product_slug(db: Session, slug: str) -> list[dict] | None:
    pid = db.execute(select(Product.id).where(Product.slug == slug)).scalar_one_or_none()
    if not pid: return None
    rows = db.execute(
        select(ProductVariant.id, ProductVariant.sku, ProductVariant.attributes,
               ProductVariant.barcode, ProductVariant.price).where(ProductVariant.product_id == pid)
    ).all()
    return [{
        "id": r.id, "sku": r.sku, "attributes": r.attributes, "barcode": r.barcode, "price": float(r.price)
    } for r in rows]
