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
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Resumen general de reportes. Disponible para ADMIN y empleados."""
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


@router.get("/financial")
def get_financial_report(
    start_date: date | None = None,
    end_date: date | None = None,
    service: ReportService = Depends(get_report_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Reporte financiero: ingresos, egresos, ganancias, flujo de caja."""
    start_dt = _combine_date(start_date)
    end_dt = _combine_date(end_date, end=True)

    try:
        financial = service.financial_report(start=start_dt, end=end_dt)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return financial


@router.get("/stock")
def get_stock_report(
    service: ReportService = Depends(get_report_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Reporte de stock: productos con stock bajo, sin movimiento, rotación."""
    try:
        stock = service.stock_report()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    return stock


@router.get("/sales")
def get_sales_report(
    start_date: date | None = None,
    end_date: date | None = None,
    service: ReportService = Depends(get_report_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Reporte de ventas: ventas por período, por producto, por cliente, tendencias."""
    start_dt = _combine_date(start_date)
    end_dt = _combine_date(end_date, end=True)

    try:
        sales = service.sales_report(start=start_dt, end=end_dt)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return sales


@router.get("/purchases")
def get_purchases_report(
    start_date: date | None = None,
    end_date: date | None = None,
    service: ReportService = Depends(get_report_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Reporte de compras: compras por proveedor, productos más comprados, gastos."""
    start_dt = _combine_date(start_date)
    end_dt = _combine_date(end_date, end=True)

    try:
        purchases = service.purchases_report(start=start_dt, end=end_dt)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return purchases


@router.get("/customers")
def get_customers_report(
    start_date: date | None = None,
    end_date: date | None = None,
    service: ReportService = Depends(get_report_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Reporte de clientes: clientes activos, nuevos, top clientes, segmentación."""
    start_dt = _combine_date(start_date)
    end_dt = _combine_date(end_date, end=True)

    try:
        customers = service.customers_report(start=start_dt, end=end_dt)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return customers


@router.get("/alerts")
def get_alerts_and_recommendations(
    service: ReportService = Depends(get_report_service),
    _: object = Depends(require_role("ADMIN", "VENTAS", "INVENTARIOS")),
):
    """Alertas y recomendaciones: stock bajo, pagos pendientes, productos sin movimiento, etc."""
    try:
        alerts = service.alerts_and_recommendations()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    return alerts

