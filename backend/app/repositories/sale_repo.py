from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.venta import ItemOrdenVenta, OrdenVenta


@dataclass(slots=True)
class SaleFilter:
    customer_id: Optional[int] = None
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

