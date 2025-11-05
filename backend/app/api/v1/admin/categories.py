from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario
from app.models.categoria import Categoria
from pydantic import BaseModel

router = APIRouter()


class CategoryCreate(BaseModel):
    nombre: str
    descripcion: str | None = None


class CategoryUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class CategoryResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None

    class Config:
        from_attributes = True


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista todas las categorías."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    categories = db.query(Categoria).all()
    return categories


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crea una nueva categoría."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    from datetime import datetime
    category = Categoria(
        nombre=category_data.nombre,
        descripcion=category_data.descripcion,
        fecha_creacion=datetime.utcnow()
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene una categoría por ID."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    category = db.query(Categoria).filter(Categoria.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualiza una categoría."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    category = db.query(Categoria).filter(Categoria.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    if category_data.nombre is not None:
        category.nombre = category_data.nombre
    if category_data.descripcion is not None:
        category.descripcion = category_data.descripcion
    
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Elimina una categoría."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    category = db.query(Categoria).filter(Categoria.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    db.delete(category)
    db.commit()
    return None

