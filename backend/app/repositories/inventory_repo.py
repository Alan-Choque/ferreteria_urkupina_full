from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.producto_almacen import ProductoAlmacen
from app.models.variante_producto import VarianteProducto
from app.models.producto import Producto
from app.models.almacen import Almacen


class InventoryRepository:
    def __init__(self, db: Session):
        self._db = db

    def stock_by_variant(self, variant_id: int) -> list[ProductoAlmacen]:
        stmt = (
            select(ProductoAlmacen)
            .options(joinedload(ProductoAlmacen.almacen))
            .where(ProductoAlmacen.variante_producto_id == variant_id)
            .order_by(ProductoAlmacen.fecha_actualizacion.desc())
        )
        return list(self._db.scalars(stmt).all())

    def list_all_stock(self) -> list[ProductoAlmacen]:
        stmt = (
            select(ProductoAlmacen)
            .options(
                joinedload(ProductoAlmacen.almacen),
                joinedload(ProductoAlmacen.variante).joinedload(VarianteProducto.producto),
                joinedload(ProductoAlmacen.variante).joinedload(VarianteProducto.unidad_medida),
            )
            .order_by(ProductoAlmacen.variante_producto_id, ProductoAlmacen.almacen_id)
        )
        return list(self._db.scalars(stmt).all())

    def get_stock_record(self, variant_id: int, warehouse_id: int) -> ProductoAlmacen | None:
        stmt = (
            select(ProductoAlmacen)
            .options(joinedload(ProductoAlmacen.almacen))
            .where(
                ProductoAlmacen.variante_producto_id == variant_id,
                ProductoAlmacen.almacen_id == warehouse_id,
            )
        )
        return self._db.scalars(stmt).first()

    def list_warehouses(self) -> list[Almacen]:
        stmt = select(Almacen).order_by(Almacen.nombre.asc())
        return list(self._db.scalars(stmt).all())

    def search_variants(self, search: str, limit: int = 20) -> list[VarianteProducto]:
        like = f"%{search.strip()}%"
        stmt = (
            select(VarianteProducto)
            .join(VarianteProducto.producto)
            .options(
                joinedload(VarianteProducto.producto),
                joinedload(VarianteProducto.unidad_medida),
                joinedload(VarianteProducto.stock_almacenes).joinedload(ProductoAlmacen.almacen),
            )
            .where(
                or_(
                    Producto.nombre.ilike(like),
                    VarianteProducto.nombre.ilike(like),
                )
            )
            .order_by(Producto.nombre.asc(), VarianteProducto.nombre.asc())
            .limit(limit)
        )
        return list(self._db.scalars(stmt).unique().all())
