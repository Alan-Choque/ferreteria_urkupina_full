from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.proveedor import Proveedor


@dataclass(slots=True)
class SupplierFilter:
    search: Optional[str] = None


class SupplierRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return select(Proveedor)

    def _apply_filters(self, stmt, filters: SupplierFilter):
        if filters.search:
            pattern = f"%{filters.search.strip()}%"
            stmt = stmt.where(
                or_(
                    Proveedor.nombre.ilike(pattern),
                    Proveedor.correo.ilike(pattern),
                    Proveedor.nit_ci.ilike(pattern),
                )
            )
        return stmt

    def list(self, filters: SupplierFilter, page: int, page_size: int) -> tuple[list[Proveedor], int]:
        stmt = self._apply_filters(self._base_stmt().order_by(Proveedor.nombre.asc()), filters)
        total_stmt = self._apply_filters(select(func.count()).select_from(Proveedor), filters)
        total = self._db.scalar(total_stmt) or 0
        rows: Sequence[Proveedor] = self._db.scalars(
            stmt.offset((page - 1) * page_size).limit(page_size)
        ).all()
        return list(rows), total

    def get(self, supplier_id: int) -> Proveedor | None:
        stmt = self._base_stmt().where(Proveedor.id == supplier_id)
        return self._db.scalars(stmt).first()

    def create(self, data: dict) -> Proveedor:
        supplier = Proveedor(
            **data,
            fecha_registro=data.get("fecha_registro") or datetime.utcnow(),
        )
        self._db.add(supplier)
        self._db.commit()
        self._db.refresh(supplier)
        return supplier

    def update(self, supplier: Proveedor, data: dict) -> Proveedor:
        for field, value in data.items():
            setattr(supplier, field, value)
        self._db.add(supplier)
        self._db.commit()
        self._db.refresh(supplier)
        return supplier

    def delete(self, supplier: Proveedor) -> None:
        self._db.delete(supplier)
        self._db.commit()

