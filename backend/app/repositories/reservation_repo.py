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

    def create(
        self,
        cliente_id: int,
        items: list[dict],
        usuario_id: Optional[int] = None,
        fecha_reserva: Optional[datetime] = None,
        observaciones: Optional[str] = None,
    ) -> Reserva:
        from datetime import datetime
        from decimal import Decimal
        from app.models.reserva import ItemReserva

        reserva = Reserva(
            cliente_id=cliente_id,
            fecha_reserva=fecha_reserva or datetime.now(),
            estado="PENDIENTE",
            usuario_id=usuario_id,
            observaciones=observaciones,
        )
        self._db.add(reserva)
        self._db.flush()

        for item_data in items:
            item = ItemReserva(
                reserva_id=reserva.id,
                variante_producto_id=item_data["variante_producto_id"],
                cantidad=Decimal(str(item_data["cantidad"])),
            )
            self._db.add(item)

        self._db.commit()
        self._db.refresh(reserva)
        return reserva

    def update(self, reserva: Reserva, data: dict) -> Reserva:
        for key, value in data.items():
            if hasattr(reserva, key):
                setattr(reserva, key, value)
        self._db.commit()
        self._db.refresh(reserva)
        return reserva

