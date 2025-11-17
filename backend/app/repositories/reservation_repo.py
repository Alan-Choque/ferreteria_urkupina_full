from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.reserva import ItemReserva, Reserva


@dataclass(slots=True)
class ReservationFilter:
    customer_id: Optional[int] = None
    estado: Optional[str] = None


class ReservationRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return (
            select(Reserva)
            .options(
                joinedload(Reserva.cliente),
                joinedload(Reserva.usuario),
                joinedload(Reserva.items).joinedload(ItemReserva.variante),
            )
        )

    def _apply_filters(self, stmt, filters: ReservationFilter):
        if filters.customer_id:
            stmt = stmt.where(Reserva.cliente_id == filters.customer_id)
        if filters.estado:
            stmt = stmt.where(Reserva.estado == filters.estado)
        return stmt

    def list(self, filters: ReservationFilter, page: int, page_size: int) -> tuple[list[Reserva], int]:
        stmt = self._apply_filters(
            self._base_stmt().order_by(Reserva.fecha_reserva.desc(), Reserva.id.desc()), filters
        )
        total_stmt = self._apply_filters(select(func.count()).select_from(Reserva), filters)
        total = self._db.scalar(total_stmt) or 0
        result = self._db.execute(
            stmt.offset((page - 1) * page_size).limit(page_size)
        ).unique()
        rows: Sequence[Reserva] = result.scalars().all()
        return list(rows), total

    def get(self, reservation_id: int) -> Reserva | None:
        stmt = self._base_stmt().where(Reserva.id == reservation_id)
        return self._db.scalars(stmt).first()

