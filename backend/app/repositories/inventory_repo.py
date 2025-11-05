from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.stock import Stock

def stock_by_variant(db: Session, variant_id: int) -> list[dict]:
    rows = db.execute(select(Stock.warehouse_id, Stock.qty).where(Stock.variant_id == variant_id)).all()
    return [{"warehouse_id": r.warehouse_id, "qty": r.qty} for r in rows]
