from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.producto_almacen import ProductoAlmacen
from app.models.variante_producto import VarianteProducto
from app.models.almacen import Almacen
from pydantic import BaseModel

router = APIRouter()


class StockResponse(BaseModel):
    variante_id: int
    cantidad_disponible: float
    almacen_id: int
    almacen_nombre: str

    class Config:
        from_attributes = True


@router.get("/stock/{variant_id}", response_model=list[StockResponse])
def get_stock_by_variant(variant_id: int, db: Session = Depends(get_db)):
    """Obtiene el stock de una variante en todos los almacenes."""
    variant = db.query(VarianteProducto).filter(VarianteProducto.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    
    stock_items = db.query(ProductoAlmacen).options(
        joinedload(ProductoAlmacen.almacen)
    ).filter(
        ProductoAlmacen.variante_producto_id == variant_id
    ).all()
    
    results = []
    for item in stock_items:
        almacen = db.query(Almacen).filter(Almacen.id == item.almacen_id).first()
        results.append(StockResponse(
            variante_id=item.variante_producto_id,
            cantidad_disponible=float(item.cantidad_disponible),
            almacen_id=item.almacen_id,
            almacen_nombre=almacen.nombre if almacen else "Desconocido"
        ))
    
    return results
