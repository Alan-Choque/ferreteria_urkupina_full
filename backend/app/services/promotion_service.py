from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.promocion import Promocion
from app.repositories.promotion_repo import PromotionFilter, PromotionRepository
from app.schemas.promotion import (
    PromotionCreateRequest,
    PromotionListResponse,
    PromotionResponse,
    PromotionRuleResponse,
    PromotionUpdateRequest,
)


@dataclass(slots=True)
class PromotionService:
    db: Session
    _repo: PromotionRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = PromotionRepository(self.db)

    def list_promotions(
        self,
        *,
        active: Optional[bool],
        page: int,
        page_size: int,
    ) -> PromotionListResponse:
        filters = PromotionFilter(active=active)
        promotions, total = self._repo.list(filters, page, page_size)
        items = [self._map_promotion(promotion) for promotion in promotions]
        return PromotionListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_promotion(self, promotion_id: int) -> PromotionResponse:
        promotion = self._repo.get(promotion_id)
        if not promotion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promoción no encontrada")
        return self._map_promotion(promotion)

    def create_promotion(self, payload: PromotionCreateRequest) -> PromotionResponse:
        data = payload.model_dump(exclude={"reglas"})
        rules = [
            {
                "tipo_regla": rule.tipo_regla,
                "valor": rule.valor,
                "descripcion": rule.descripcion,
            }
            for rule in payload.reglas
        ]
        promotion = self._repo.create(data, rules=rules)
        return self._map_promotion(promotion)

    def update_promotion(self, promotion_id: int, payload: PromotionUpdateRequest) -> PromotionResponse:
        promotion = self._repo.get(promotion_id)
        if not promotion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promoción no encontrada")
        data = payload.model_dump(exclude={"reglas"}, exclude_unset=True)
        rules_payload = payload.reglas
        rules = None
        if rules_payload is not None:
            rules = [
                {
                    "tipo_regla": rule.tipo_regla,
                    "valor": rule.valor,
                    "descripcion": rule.descripcion,
                }
                for rule in rules_payload
            ]
        promotion = self._repo.update(promotion, data, rules=rules)
        return self._map_promotion(promotion)

    def delete_promotion(self, promotion_id: int) -> None:
        promotion = self._repo.get(promotion_id)
        if not promotion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promoción no encontrada")
        self._repo.delete(promotion)

    @staticmethod
    def _map_promotion(promotion: Promocion) -> PromotionResponse:
        reglas = [PromotionRuleResponse.model_validate(rule) for rule in promotion.reglas]
        return PromotionResponse(
            id=promotion.id,
            nombre=promotion.nombre,
            descripcion=promotion.descripcion,
            fecha_inicio=promotion.fecha_inicio,
            fecha_fin=promotion.fecha_fin,
            activo=bool(promotion.activo),
            reglas=reglas,
        )

