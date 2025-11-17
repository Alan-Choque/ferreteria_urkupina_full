from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import func, literal, select
from sqlalchemy.orm import Session

from app.models import (
    Categoria,
    Cliente,
    ItemOrdenVenta,
    OrdenVenta,
    Producto,
    ProductoAlmacen,
    VarianteProducto,
)


@dataclass(slots=True)
class ReportSummary:
    sales_last_30_days: float
    pending_orders: int
    low_stock_products: int
    active_customers_last_30_days: int


@dataclass(slots=True)
class CategoryBreakdown:
    category: str
    total: float
    percentage: float


@dataclass(slots=True)
class TopProduct:
    product: str
    total: float


@dataclass(slots=True)
class ReportService:
    db: Session
    LOW_STOCK_THRESHOLD: float = 5.0

    def summary(
        self,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> tuple[ReportSummary, List[CategoryBreakdown], List[TopProduct]]:
        end_dt = end or datetime.utcnow()
        start_dt = start or (end_dt - timedelta(days=30))

        if start_dt > end_dt:
            raise ValueError("La fecha inicial no puede ser posterior a la final")

        sales_total = self._sales_total_between(start_dt, end_dt)
        pending_orders = self._pending_orders_between(start_dt, end_dt)
        low_stock = self._low_stock_products()
        active_customers = self._active_customers_between(start_dt, end_dt)
        categories = self._sales_by_category_between(start_dt, end_dt)
        top_products = self._top_products_between(start_dt, end_dt)

        summary = ReportSummary(
            sales_last_30_days=sales_total,
            pending_orders=pending_orders,
            low_stock_products=low_stock,
            active_customers_last_30_days=active_customers,
        )
        return summary, categories, top_products

    def _sales_total_between(self, start: datetime, end: datetime) -> float:
        stmt = (
            select(
                func.coalesce(
                    func.sum(ItemOrdenVenta.cantidad * func.coalesce(ItemOrdenVenta.precio_unitario, 0)),
                    0,
                )
            )
            .select_from(OrdenVenta)
            .join(ItemOrdenVenta, ItemOrdenVenta.orden_venta_id == OrdenVenta.id)
            .where(OrdenVenta.fecha >= start, OrdenVenta.fecha <= end)
        )
        result = self.db.execute(stmt).scalar_one()
        return float(result or 0)

    def _pending_orders_between(self, start: datetime, end: datetime) -> int:
        stmt = (
            select(func.count(OrdenVenta.id))
            .where(OrdenVenta.estado.in_(["PENDIENTE", "EN_PROCESO", "ENVIADO"]))
            .where(OrdenVenta.fecha >= start, OrdenVenta.fecha <= end)
        )
        result = self.db.execute(stmt).scalar_one()
        return int(result or 0)

    def _low_stock_products(self) -> int:
        stmt = select(func.count(ProductoAlmacen.id)).where(
            ProductoAlmacen.cantidad_disponible < literal(self.LOW_STOCK_THRESHOLD)
        )
        result = self.db.execute(stmt).scalar_one()
        return int(result or 0)

    def _active_customers_between(self, start: datetime, end: datetime) -> int:
        stmt = (
            select(func.count(func.distinct(OrdenVenta.cliente_id)))
            .select_from(OrdenVenta)
            .join(Cliente, Cliente.id == OrdenVenta.cliente_id)
            .where(OrdenVenta.fecha >= start, OrdenVenta.fecha <= end)
        )
        result = self.db.execute(stmt).scalar_one()
        return int(result or 0)

    def _sales_by_category_between(self, start: datetime, end: datetime) -> List[CategoryBreakdown]:
        total_expr = func.coalesce(
            func.sum(ItemOrdenVenta.cantidad * func.coalesce(ItemOrdenVenta.precio_unitario, 0)),
            0,
        )
        stmt = (
            select(Categoria.nombre.label("category"), total_expr.label("total"))
            .select_from(OrdenVenta)
            .join(ItemOrdenVenta, ItemOrdenVenta.orden_venta_id == OrdenVenta.id)
            .join(VarianteProducto, VarianteProducto.id == ItemOrdenVenta.variante_producto_id)
            .join(Producto, Producto.id == VarianteProducto.producto_id)
            .join(Categoria, Categoria.id == Producto.categoria_id)
            .where(OrdenVenta.fecha >= start, OrdenVenta.fecha <= end)
            .group_by(Categoria.nombre)
            .order_by(total_expr.desc())
        )
        rows = self.db.execute(stmt).all()
        totals = [float(row.total or 0) for row in rows]
        grand_total = sum(totals) or 1.0
        breakdown: List[CategoryBreakdown] = []
        for row, total in zip(rows, totals):
            percentage = round((total / grand_total) * 100, 2)
            breakdown.append(CategoryBreakdown(category=row.category, total=round(total, 2), percentage=percentage))
        return breakdown

    def _top_products_between(self, start: datetime, end: datetime, limit: int = 5) -> List[TopProduct]:
        total_expr = func.coalesce(
            func.sum(ItemOrdenVenta.cantidad * func.coalesce(ItemOrdenVenta.precio_unitario, 0)),
            0,
        )
        stmt = (
            select(Producto.nombre.label("product"), total_expr.label("total"))
            .select_from(OrdenVenta)
            .join(ItemOrdenVenta, ItemOrdenVenta.orden_venta_id == OrdenVenta.id)
            .join(VarianteProducto, VarianteProducto.id == ItemOrdenVenta.variante_producto_id)
            .join(Producto, Producto.id == VarianteProducto.producto_id)
            .where(OrdenVenta.fecha >= start, OrdenVenta.fecha <= end)
            .group_by(Producto.nombre)
            .order_by(total_expr.desc())
            .limit(limit)
        )
        rows = self.db.execute(stmt).all()
        return [TopProduct(product=row.product, total=round(float(row.total or 0), 2)) for row in rows]


