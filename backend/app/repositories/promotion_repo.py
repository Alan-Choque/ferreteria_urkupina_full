from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.promocion import Promocion, ReglaPromocion


@dataclass(slots=True)
class PromotionFilter:
    active: Optional[bool] = None


class PromotionRepository:
    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return select(Promocion).options(joinedload(Promocion.reglas))

    def _apply_filters(self, stmt, filters: PromotionFilter):
        if filters.active is not None:
            stmt = stmt.where(Promocion.activo == filters.active)
        return stmt

    def list(self, filters: PromotionFilter, page: int, page_size: int) -> tuple[list[Promocion], int]:
        stmt = self._apply_filters(
            self._base_stmt().order_by(Promocion.fecha_inicio.desc(), Promocion.id.desc()),
            filters,
        )
        total_stmt = self._apply_filters(select(func.count()).select_from(Promocion), filters)
        total = self._db.scalar(total_stmt) or 0
        rows: Sequence[Promocion] = (
            self._db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).unique().all()
        )
        return list(rows), total

    def get(self, promotion_id: int) -> Promocion | None:
        stmt = self._base_stmt().where(Promocion.id == promotion_id)
        return self._db.scalars(stmt).unique().first()

    def create(self, data: dict, rules: list[dict]) -> Promocion:
        promotion = Promocion(**data)
        self._db.add(promotion)
        self._db.flush()
        for rule in rules:
            promotion.reglas.append(
                ReglaPromocion(
                    promocion=promotion,
                    tipo_regla=rule["tipo_regla"],
                    valor=rule["valor"],
                    descripcion=rule.get("descripcion"),
                )
            )
        self._db.commit()
        self._db.refresh(promotion)
        return promotion

    def update(self, promotion: Promocion, data: dict, rules: Optional[list[dict]] = None) -> Promocion:
        for key, value in data.items():
            setattr(promotion, key, value)
        if rules is not None:
            existing = list(promotion.reglas)
            for rule in existing:
                self._db.delete(rule)
            promotion.reglas = []
            for rule in rules:
                promotion.reglas.append(
                    ReglaPromocion(
                        promocion=promotion,
                        tipo_regla=rule["tipo_regla"],
                        valor=rule["valor"],
                        descripcion=rule.get("descripcion"),
                    )
                )
        self._db.add(promotion)
        self._db.commit()
        self._db.refresh(promotion)
        return promotion

    def delete(self, promotion: Promocion) -> None:
        for rule in list(promotion.reglas):
            self._db.delete(rule)
        self._db.delete(promotion)
        self._db.commit()

