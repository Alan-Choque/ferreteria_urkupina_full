from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.venta import ItemOrdenVenta, OrdenVenta


@dataclass(slots=True)
class SaleFilter:
    customer_id: Optional[int] = None
    usuario_id: Optional[int] = None
    estado: Optional[str] = None


class SaleRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return (
            select(OrdenVenta)
            .options(
                joinedload(OrdenVenta.cliente),
                joinedload(OrdenVenta.usuario),
                joinedload(OrdenVenta.items).joinedload(ItemOrdenVenta.variante),
            )
        )

    def _apply_filters(self, stmt, filters: SaleFilter):
        if filters.customer_id:
            stmt = stmt.where(OrdenVenta.cliente_id == filters.customer_id)
        if filters.usuario_id:
            stmt = stmt.where(OrdenVenta.usuario_id == filters.usuario_id)
        if filters.estado:
            stmt = stmt.where(OrdenVenta.estado == filters.estado)
        return stmt

    def list(self, filters: SaleFilter, page: int, page_size: int) -> tuple[list[OrdenVenta], int]:
        stmt = self._apply_filters(
            self._base_stmt().order_by(OrdenVenta.fecha.desc(), OrdenVenta.id.desc()), filters
        )
        total_stmt = self._apply_filters(select(func.count()).select_from(OrdenVenta), filters)
        total = self._db.scalar(total_stmt) or 0
        result = self._db.execute(
            stmt.offset((page - 1) * page_size).limit(page_size)
        ).unique()
        rows: Sequence[OrdenVenta] = result.scalars().all()
        return list(rows), total

    def get(self, order_id: int) -> OrdenVenta | None:
        stmt = self._base_stmt().where(OrdenVenta.id == order_id)
        return self._db.scalars(stmt).first()

    def create(
        self,
        cliente_id: int,
        items: list[dict],
        estado: str = "PENDIENTE",
        usuario_id: Optional[int] = None,
        metodo_pago: Optional[str] = None,
        direccion_entrega: Optional[str] = None,
        sucursal_recogida_id: Optional[int] = None,
    ) -> OrdenVenta:
        from datetime import datetime
        from decimal import Decimal
        from app.models.venta import ItemOrdenVenta

        orden = OrdenVenta(
            cliente_id=cliente_id,
            fecha=datetime.now(),
            estado=estado,
            usuario_id=usuario_id,
            metodo_pago=metodo_pago,
            direccion_entrega=direccion_entrega,
            sucursal_recogida_id=sucursal_recogida_id,
        )
        self._db.add(orden)
        self._db.flush()

        for item_data in items:
            item = ItemOrdenVenta(
                orden_venta_id=orden.id,
                variante_producto_id=item_data["variante_producto_id"],
                cantidad=Decimal(str(item_data["cantidad"])),
                precio_unitario=Decimal(str(item_data["precio_unitario"])) if item_data.get("precio_unitario") else None,
            )
            self._db.add(item)

        self._db.commit()
        self._db.refresh(orden)
        return orden

