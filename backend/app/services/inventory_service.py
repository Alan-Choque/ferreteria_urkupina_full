from sqlalchemy.orm import Session
from app.repositories import inventory_repo

def stock_by_variant(db: Session, variant_id: int):
    return inventory_repo.stock_by_variant(db, variant_id)
