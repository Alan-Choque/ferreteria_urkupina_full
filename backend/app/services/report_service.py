from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import func, literal, select, Date
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

    def financial_report(
        self,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> dict:
        """Genera reporte financiero: ingresos, egresos, ganancias, flujo de caja."""
        from app.models import FacturaVenta, PagoCliente, OrdenCompra, ItemOrdenCompra
        
        end_dt = end or datetime.utcnow()
        start_dt = start or (end_dt - timedelta(days=30))

        if start_dt > end_dt:
            raise ValueError("La fecha inicial no puede ser posterior a la final")

        # Ingresos: total de facturas pagadas
        ingresos_stmt = (
            select(func.coalesce(func.sum(FacturaVenta.total), 0))
            .where(FacturaVenta.fecha_emision >= start_dt, FacturaVenta.fecha_emision <= end_dt)
            .where(FacturaVenta.estado == "PAGADO")
        )
        ingresos = float(self.db.execute(ingresos_stmt).scalar_one() or 0)

        # Egresos: total de compras recibidas
        egresos_stmt = (
            select(
                func.coalesce(
                    func.sum(ItemOrdenCompra.cantidad * func.coalesce(ItemOrdenCompra.precio_unitario, 0)),
                    0
                )
            )
            .select_from(OrdenCompra)
            .join(ItemOrdenCompra, ItemOrdenCompra.orden_compra_id == OrdenCompra.id)
            .where(OrdenCompra.fecha_recepcion >= start_dt, OrdenCompra.fecha_recepcion <= end_dt)
            .where(OrdenCompra.estado == "RECIBIDO")
        )
        egresos = float(self.db.execute(egresos_stmt).scalar_one() or 0)

        # Ganancias
        ganancias = ingresos - egresos

        # Flujo de caja: pagos recibidos vs pagos realizados
        pagos_recibidos_stmt = (
            select(func.coalesce(func.sum(PagoCliente.monto), 0))
            .where(PagoCliente.fecha_pago >= start_dt, PagoCliente.fecha_pago <= end_dt)
            .where(PagoCliente.estado == "CONFIRMADO")
        )
        pagos_recibidos = float(self.db.execute(pagos_recibidos_stmt).scalar_one() or 0)

        return {
            "period": {
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
            },
            "ingresos": round(ingresos, 2),
            "egresos": round(egresos, 2),
            "ganancias": round(ganancias, 2),
            "margen_ganancia": round((ganancias / ingresos * 100) if ingresos > 0 else 0, 2),
            "flujo_caja": {
                "pagos_recibidos": round(pagos_recibidos, 2),
                "diferencia": round(pagos_recibidos - egresos, 2),
            },
        }

    def stock_report(self) -> dict:
        """Genera reporte de stock: productos con stock bajo, sin movimiento, rotación."""
        from app.models import ProductoAlmacen, VarianteProducto, Producto, ItemOrdenVenta
        
        # Productos con stock bajo
        low_stock_stmt = (
            select(
                Producto.nombre,
                VarianteProducto.nombre.label("variante"),
                ProductoAlmacen.cantidad_disponible,
            )
            .select_from(ProductoAlmacen)
            .join(VarianteProducto, VarianteProducto.id == ProductoAlmacen.variante_producto_id)
            .join(Producto, Producto.id == VarianteProducto.producto_id)
            .where(ProductoAlmacen.cantidad_disponible < literal(self.LOW_STOCK_THRESHOLD))
            .order_by(ProductoAlmacen.cantidad_disponible.asc())
        )
        low_stock = [
            {
                "producto": row.nombre,
                "variante": row.variante or "N/A",
                "stock_disponible": float(row.cantidad_disponible or 0),
                "stock_reservado": 0.0,  # No existe campo cantidad_reservada en ProductoAlmacen
            }
            for row in self.db.execute(low_stock_stmt).all()
        ]

        # Productos sin movimiento (últimos 90 días)
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        products_with_sales = (
            select(func.distinct(ItemOrdenVenta.variante_producto_id))
            .select_from(ItemOrdenVenta)
            .join(OrdenVenta, OrdenVenta.id == ItemOrdenVenta.orden_venta_id)
            .where(OrdenVenta.fecha >= ninety_days_ago)
        )
        
        no_movement_stmt = (
            select(
                Producto.nombre,
                VarianteProducto.nombre.label("variante"),
                ProductoAlmacen.cantidad_disponible,
            )
            .select_from(ProductoAlmacen)
            .join(VarianteProducto, VarianteProducto.id == ProductoAlmacen.variante_producto_id)
            .join(Producto, Producto.id == VarianteProducto.producto_id)
            .where(~ProductoAlmacen.variante_producto_id.in_(products_with_sales))
            .order_by(ProductoAlmacen.cantidad_disponible.desc())
        )
        no_movement = [
            {
                "producto": row.nombre,
                "variante": row.variante or "N/A",
                "stock_disponible": float(row.cantidad_disponible or 0),
            }
            for row in self.db.execute(no_movement_stmt).all()
        ]

        return {
            "low_stock": {
                "count": len(low_stock),
                "items": low_stock,
            },
            "no_movement": {
                "count": len(no_movement),
                "items": no_movement[:50],  # Limitar a 50 para no sobrecargar
            },
        }

    def sales_report(
        self,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> dict:
        """Genera reporte de ventas: ventas por período, por producto, por cliente, tendencias."""
        end_dt = end or datetime.utcnow()
        start_dt = start or (end_dt - timedelta(days=30))

        if start_dt > end_dt:
            raise ValueError("La fecha inicial no puede ser posterior a la final")

        # Ventas totales
        total_sales = self._sales_total_between(start_dt, end_dt)

        # Ventas por día
        daily_sales_stmt = (
            select(
                func.cast(OrdenVenta.fecha, Date).label("date"),
                func.coalesce(
                    func.sum(ItemOrdenVenta.cantidad * func.coalesce(ItemOrdenVenta.precio_unitario, 0)),
                    0
                ).label("total")
            )
            .select_from(OrdenVenta)
            .join(ItemOrdenVenta, ItemOrdenVenta.orden_venta_id == OrdenVenta.id)
            .where(OrdenVenta.fecha >= start_dt, OrdenVenta.fecha <= end_dt)
            .group_by(func.cast(OrdenVenta.fecha, Date))
            .order_by(func.cast(OrdenVenta.fecha, Date))
        )
        daily_sales = [
            {
                "fecha": row.date.isoformat(),
                "total": round(float(row.total or 0), 2),
            }
            for row in self.db.execute(daily_sales_stmt).all()
        ]

        # Top productos vendidos
        top_products = self._top_products_between(start_dt, end_dt, limit=10)

        # Top clientes
        top_customers_stmt = (
            select(
                Cliente.nombre,
                func.coalesce(
                    func.sum(ItemOrdenVenta.cantidad * func.coalesce(ItemOrdenVenta.precio_unitario, 0)),
                    0
                ).label("total")
            )
            .select_from(OrdenVenta)
            .join(ItemOrdenVenta, ItemOrdenVenta.orden_venta_id == OrdenVenta.id)
            .join(Cliente, Cliente.id == OrdenVenta.cliente_id)
            .where(OrdenVenta.fecha >= start_dt, OrdenVenta.fecha <= end_dt)
            .group_by(Cliente.nombre)
            .order_by(func.coalesce(
                func.sum(ItemOrdenVenta.cantidad * func.coalesce(ItemOrdenVenta.precio_unitario, 0)),
                0
            ).desc())
            .limit(10)
        )
        top_customers = [
            {
                "cliente": row.nombre,
                "total": round(float(row.total or 0), 2),
            }
            for row in self.db.execute(top_customers_stmt).all()
        ]

        return {
            "period": {
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
            },
            "total_ventas": round(total_sales, 2),
            "ventas_por_dia": daily_sales,
            "top_productos": [{"producto": p.product, "total": p.total} for p in top_products],
            "top_clientes": top_customers,
        }

    def purchases_report(
        self,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> dict:
        """Genera reporte de compras: compras por proveedor, productos más comprados, gastos."""
        from app.models import OrdenCompra, ItemOrdenCompra, Proveedor
        
        end_dt = end or datetime.utcnow()
        start_dt = start or (end_dt - timedelta(days=30))

        if start_dt > end_dt:
            raise ValueError("La fecha inicial no puede ser posterior a la final")

        # Total de compras
        total_purchases_stmt = (
            select(
                func.coalesce(
                    func.sum(ItemOrdenCompra.cantidad * func.coalesce(ItemOrdenCompra.precio_unitario, 0)),
                    0
                )
            )
            .select_from(OrdenCompra)
            .join(ItemOrdenCompra, ItemOrdenCompra.orden_compra_id == OrdenCompra.id)
            .where(OrdenCompra.fecha_recepcion >= start_dt, OrdenCompra.fecha_recepcion <= end_dt)
            .where(OrdenCompra.estado == "RECIBIDO")
        )
        total_purchases = float(self.db.execute(total_purchases_stmt).scalar_one() or 0)

        # Compras por proveedor
        by_supplier_stmt = (
            select(
                Proveedor.nombre,
                func.coalesce(
                    func.sum(ItemOrdenCompra.cantidad * func.coalesce(ItemOrdenCompra.precio_unitario, 0)),
                    0
                ).label("total")
            )
            .select_from(OrdenCompra)
            .join(ItemOrdenCompra, ItemOrdenCompra.orden_compra_id == OrdenCompra.id)
            .join(Proveedor, Proveedor.id == OrdenCompra.proveedor_id)
            .where(OrdenCompra.fecha_recepcion >= start_dt, OrdenCompra.fecha_recepcion <= end_dt)
            .where(OrdenCompra.estado == "RECIBIDO")
            .group_by(Proveedor.nombre)
            .order_by(func.coalesce(
                func.sum(ItemOrdenCompra.cantidad * func.coalesce(ItemOrdenCompra.precio_unitario, 0)),
                0
            ).desc())
        )
        by_supplier = [
            {
                "proveedor": row.nombre,
                "total": round(float(row.total or 0), 2),
            }
            for row in self.db.execute(by_supplier_stmt).all()
        ]

        return {
            "period": {
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
            },
            "total_compras": round(total_purchases, 2),
            "compras_por_proveedor": by_supplier,
        }

    def customers_report(
        self,
        *,
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> dict:
        """Genera reporte de clientes: clientes activos, nuevos, top clientes, segmentación."""
        end_dt = end or datetime.utcnow()
        start_dt = start or (end_dt - timedelta(days=30))

        if start_dt > end_dt:
            raise ValueError("La fecha inicial no puede ser posterior a la final")

        # Clientes activos
        active_customers = self._active_customers_between(start_dt, end_dt)

        # Clientes nuevos
        new_customers_stmt = (
            select(func.count(Cliente.id))
            .where(Cliente.fecha_registro >= start_dt, Cliente.fecha_registro <= end_dt)
        )
        new_customers = int(self.db.execute(new_customers_stmt).scalar_one() or 0)

        # Top clientes (ya calculado en sales_report, pero lo incluimos aquí también)
        top_customers_stmt = (
            select(
                Cliente.nombre,
                Cliente.correo,
                func.count(OrdenVenta.id).label("total_ordenes"),
                func.coalesce(
                    func.sum(ItemOrdenVenta.cantidad * func.coalesce(ItemOrdenVenta.precio_unitario, 0)),
                    0
                ).label("total_gastado")
            )
            .select_from(Cliente)
            .join(OrdenVenta, OrdenVenta.cliente_id == Cliente.id)
            .join(ItemOrdenVenta, ItemOrdenVenta.orden_venta_id == OrdenVenta.id)
            .where(OrdenVenta.fecha >= start_dt, OrdenVenta.fecha <= end_dt)
            .group_by(Cliente.nombre, Cliente.correo)
            .order_by(func.coalesce(
                func.sum(ItemOrdenVenta.cantidad * func.coalesce(ItemOrdenVenta.precio_unitario, 0)),
                0
            ).desc())
            .limit(10)
        )
        top_customers = [
            {
                "nombre": row.nombre,
                "correo": row.correo or "N/A",
                "total_ordenes": int(row.total_ordenes or 0),
                "total_gastado": round(float(row.total_gastado or 0), 2),
            }
            for row in self.db.execute(top_customers_stmt).all()
        ]

        return {
            "period": {
                "start": start_dt.isoformat(),
                "end": end_dt.isoformat(),
            },
            "clientes_activos": active_customers,
            "clientes_nuevos": new_customers,
            "top_clientes": top_customers,
        }

    def alerts_and_recommendations(self) -> dict:
        """Genera alertas y recomendaciones: stock bajo, pagos pendientes, productos sin movimiento, etc."""
        from app.models import FacturaVenta, PagoCliente, OrdenVenta
        
        alerts = []
        recommendations = []

        # Alerta: Stock bajo
        low_stock_count = self._low_stock_products()
        if low_stock_count > 0:
            alerts.append({
                "type": "warning",
                "title": "Productos con stock bajo",
                "message": f"Hay {low_stock_count} productos con stock por debajo del umbral ({self.LOW_STOCK_THRESHOLD} unidades)",
                "action": "Revisar inventario y realizar compras",
            })

        # Alerta: Pagos pendientes
        pending_payments_stmt = (
            select(func.count(FacturaVenta.id))
            .where(FacturaVenta.estado == "PENDIENTE")
        )
        pending_payments = int(self.db.execute(pending_payments_stmt).scalar_one() or 0)
        if pending_payments > 0:
            alerts.append({
                "type": "info",
                "title": "Facturas pendientes de pago",
                "message": f"Hay {pending_payments} facturas pendientes de pago",
                "action": "Revisar y gestionar pagos pendientes",
            })

        # Alerta: Órdenes pendientes
        pending_orders_stmt = (
            select(func.count(OrdenVenta.id))
            .where(OrdenVenta.estado.in_(["PENDIENTE", "EN_PROCESO", "ENVIADO"]))
        )
        pending_orders = int(self.db.execute(pending_orders_stmt).scalar_one() or 0)
        if pending_orders > 5:
            alerts.append({
                "type": "warning",
                "title": "Órdenes pendientes",
                "message": f"Hay {pending_orders} órdenes pendientes de procesar",
                "action": "Revisar y completar órdenes pendientes",
            })

        # Recomendación: Productos sin movimiento
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        products_with_sales = (
            select(func.distinct(ItemOrdenVenta.variante_producto_id))
            .select_from(ItemOrdenVenta)
            .join(OrdenVenta, OrdenVenta.id == ItemOrdenVenta.orden_venta_id)
            .where(OrdenVenta.fecha >= ninety_days_ago)
        )
        no_movement_count = (
            select(func.count(ProductoAlmacen.id))
            .where(~ProductoAlmacen.variante_producto_id.in_(products_with_sales))
        )
        no_movement = int(self.db.execute(no_movement_count).scalar_one() or 0)
        if no_movement > 0:
            recommendations.append({
                "type": "suggestion",
                "title": "Productos sin movimiento",
                "message": f"Hay {no_movement} productos sin ventas en los últimos 90 días",
                "action": "Considerar promociones o descuentos para estos productos",
            })

        return {
            "alerts": alerts,
            "recommendations": recommendations,
            "generated_at": datetime.utcnow().isoformat(),
        }


