from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.compra import ItemOrdenCompra, OrdenCompra


@dataclass(slots=True)
class PurchaseFilter:
    supplier_id: Optional[int] = None
    estado: Optional[str] = None


class PurchaseRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return (
            select(OrdenCompra)
            .options(
                joinedload(OrdenCompra.proveedor),
                joinedload(OrdenCompra.usuario),
                joinedload(OrdenCompra.items).joinedload(ItemOrdenCompra.variante),
            )
        )

    def _apply_filters(self, stmt, filters: PurchaseFilter):
        if filters.supplier_id:
            stmt = stmt.where(OrdenCompra.proveedor_id == filters.supplier_id)
        if filters.estado:
            stmt = stmt.where(OrdenCompra.estado == filters.estado)
        return stmt

    def list(self, filters: PurchaseFilter, page: int, page_size: int) -> tuple[list[OrdenCompra], int]:
        stmt = self._apply_filters(
            self._base_stmt().order_by(OrdenCompra.fecha.desc(), OrdenCompra.id.desc()), filters
        )
        total_stmt = self._apply_filters(select(func.count()).select_from(OrdenCompra), filters)
        total = self._db.scalar(total_stmt) or 0
        result = self._db.execute(
            stmt.offset((page - 1) * page_size).limit(page_size)
        ).unique()
        rows: Sequence[OrdenCompra] = result.scalars().all()
        return list(rows), total

    def get(self, order_id: int) -> OrdenCompra | None:
        stmt = self._base_stmt().where(OrdenCompra.id == order_id)
        return self._db.scalars(stmt).first()

