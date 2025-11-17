from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.promotion import (
    PromotionCreateRequest,
    PromotionListResponse,
    PromotionResponse,
    PromotionUpdateRequest,
)
from app.services.promotion_service import PromotionService

router = APIRouter()


def get_promotion_service(db: Session = Depends(get_db)) -> PromotionService:
    return PromotionService(db=db)


@router.get("", response_model=PromotionListResponse)
def list_promotions(
    active: Optional[bool] = None,
    page: int = 1,
    page_size: int = 50,
    service: PromotionService = Depends(get_promotion_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_promotions(active=active, page=page, page_size=page_size)


@router.get("/{promotion_id}", response_model=PromotionResponse)
def get_promotion(
    promotion_id: int,
    service: PromotionService = Depends(get_promotion_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_promotion(promotion_id)


@router.post("", response_model=PromotionResponse, status_code=status.HTTP_201_CREATED)
def create_promotion(
    payload: PromotionCreateRequest,
    service: PromotionService = Depends(get_promotion_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.create_promotion(payload)


@router.put("/{promotion_id}", response_model=PromotionResponse)
def update_promotion(
    promotion_id: int,
    payload: PromotionUpdateRequest,
    service: PromotionService = Depends(get_promotion_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.update_promotion(promotion_id, payload)


@router.delete("/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promotion(
    promotion_id: int,
    service: PromotionService = Depends(get_promotion_service),
    _: object = Depends(require_role("ADMIN")),
):
    service.delete_promotion(promotion_id)
