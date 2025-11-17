from __future__ import annotations

from pydantic import BaseModel


class ReportSummary(BaseModel):
    sales_last_30_days: float
    pending_orders: int
    low_stock_products: int
    active_customers_last_30_days: int


class CategoryBreakdown(BaseModel):
    category: str
    total: float
    percentage: float


class TopProduct(BaseModel):
    product: str
    total: float


class ReportsSummaryResponse(BaseModel):
    summary: ReportSummary
    category_breakdown: list[CategoryBreakdown]
    top_products: list[TopProduct]

