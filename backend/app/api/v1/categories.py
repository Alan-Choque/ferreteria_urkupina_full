from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.categoria import Categoria
from pydantic import BaseModel

router = APIRouter()


class CategoryResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None

    class Config:
        from_attributes = True


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
):
    """Lista todas las categorías (endpoint público)."""
    categories = db.query(Categoria).order_by(Categoria.nombre).all()
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
):
    """Obtiene una categoría por ID (endpoint público)."""
    category = db.query(Categoria).filter(Categoria.id == category_id).first()
    if not category:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    return category

