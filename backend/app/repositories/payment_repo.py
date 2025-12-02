from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.pago import PagoCliente


@dataclass(slots=True)
class PaymentFilter:
    cliente_id: Optional[int] = None
    factura_id: Optional[int] = None
    orden_venta_id: Optional[int] = None
    estado: Optional[str] = None


class PaymentRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return (
            select(PagoCliente)
            .options(
                joinedload(PagoCliente.cliente),
                joinedload(PagoCliente.factura),
                joinedload(PagoCliente.orden_venta),
                joinedload(PagoCliente.usuario),
            )
        )

    def _apply_filters(self, stmt, filters: PaymentFilter):
        if filters.cliente_id:
            stmt = stmt.where(PagoCliente.cliente_id == filters.cliente_id)
        if filters.factura_id:
            stmt = stmt.where(PagoCliente.factura_id == filters.factura_id)
        if filters.orden_venta_id:
            stmt = stmt.where(PagoCliente.orden_venta_id == filters.orden_venta_id)
        if filters.estado:
            stmt = stmt.where(PagoCliente.estado == filters.estado)
        return stmt

    def list(self, filters: PaymentFilter, page: int, page_size: int) -> tuple[list[PagoCliente], int]:
        stmt = self._apply_filters(
            self._base_stmt().order_by(PagoCliente.fecha_pago.desc(), PagoCliente.id.desc()),
            filters,
        )
        total_stmt = self._apply_filters(select(func.count()).select_from(PagoCliente), filters)
        total = self._db.scalar(total_stmt) or 0
        result = self._db.execute(stmt.offset((page - 1) * page_size).limit(page_size)).unique()
        return list(result.scalars().all()), total

    def get(self, payment_id: int) -> Optional[PagoCliente]:
        stmt = self._base_stmt().where(PagoCliente.id == payment_id)
        result = self._db.execute(stmt).unique()
        return result.scalar_one_or_none()

    def create(self, **kwargs) -> PagoCliente:
        payment = PagoCliente(**kwargs)
        self._db.add(payment)
        self._db.flush()
        return payment

    def get_total_paid_by_factura(self, factura_id: int) -> float:
        """Calcula el total pagado para una factura"""
        result = (
            self._db.query(func.sum(PagoCliente.monto))
            .filter(
                PagoCliente.factura_id == factura_id,
                PagoCliente.estado == "CONFIRMADO",
            )
            .scalar()
        )
        return float(result) if result else 0.0

