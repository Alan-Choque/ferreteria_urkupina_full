from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.reservation import ReservationListResponse, ReservationResponse
from app.services.reservation_service import ReservationService

router = APIRouter()


def get_reservation_service(db: Session = Depends(get_db)) -> ReservationService:
    return ReservationService(db=db)


@router.get("", response_model=ReservationListResponse)
def list_reservations(
    customer_id: Optional[int] = None,
    estado: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: ReservationService = Depends(get_reservation_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.list_reservations(customer_id=customer_id, estado=estado, page=page, page_size=page_size)


@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(
    reservation_id: int,
    service: ReservationService = Depends(get_reservation_service),
    _: object = Depends(require_role("ADMIN")),
):
    return service.get_reservation(reservation_id)

