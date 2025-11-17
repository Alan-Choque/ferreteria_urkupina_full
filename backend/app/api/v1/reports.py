from dataclasses import asdict
from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.db.session import get_db
from app.schemas.report import ReportsSummaryResponse
from app.services.report_service import ReportService

router = APIRouter()


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    return ReportService(db=db)


def _combine_date(value: date | None, end: bool = False) -> datetime | None:
    if value is None:
        return None
    return datetime.combine(value, time.max if end else time.min)


@router.get("/summary", response_model=ReportsSummaryResponse)
def get_reports_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    service: ReportService = Depends(get_report_service),
    _: object = Depends(require_role("ADMIN")),
):
    start_dt = _combine_date(start_date)
    end_dt = _combine_date(end_date, end=True)

    try:
        summary, categories, top_products = service.summary(start=start_dt, end=end_dt)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ReportsSummaryResponse(
        summary=asdict(summary),
        category_breakdown=[asdict(category) for category in categories],
        top_products=[asdict(product) for product in top_products],
    )

