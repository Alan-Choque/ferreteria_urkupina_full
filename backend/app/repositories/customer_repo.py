from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.cliente import Cliente


@dataclass(slots=True)
class CustomerFilter:
    search: Optional[str] = None


class CustomerRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return select(Cliente)

    def _apply_filters(self, stmt, filters: CustomerFilter):
        if filters.search:
            pattern = f"%{filters.search.strip()}%"
            stmt = stmt.where(
                or_(
                    Cliente.nombre.ilike(pattern),
                    Cliente.correo.ilike(pattern),
                    Cliente.nit_ci.ilike(pattern),
                )
            )
        return stmt

    def list(self, filters: CustomerFilter, page: int, page_size: int) -> tuple[list[Cliente], int]:
        stmt = self._apply_filters(self._base_stmt().order_by(Cliente.nombre.asc()), filters)
        total_stmt = self._apply_filters(select(func.count()).select_from(Cliente), filters)
        total = self._db.scalar(total_stmt) or 0
        rows: Sequence[Cliente] = self._db.scalars(
            stmt.offset((page - 1) * page_size).limit(page_size)
        ).all()
        return list(rows), total

    def get(self, customer_id: int) -> Cliente | None:
        stmt = self._base_stmt().where(Cliente.id == customer_id)
        return self._db.scalars(stmt).first()

    def create(self, data: dict) -> Cliente:
        customer = Cliente(**data)
        self._db.add(customer)
        self._db.commit()
        self._db.refresh(customer)
        return customer

    def update(self, customer: Cliente, data: dict) -> Cliente:
        for field, value in data.items():
            setattr(customer, field, value)
        self._db.add(customer)
        self._db.commit()
        self._db.refresh(customer)
        return customer

    def delete(self, customer: Cliente) -> None:
        if customer.ordenes_venta or customer.reservas:
            raise ValueError("El cliente tiene operaciones asociadas")
        self._db.delete(customer)
        self._db.commit()

