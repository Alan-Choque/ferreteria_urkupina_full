from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario
from app.models.marca import Marca
from pydantic import BaseModel

router = APIRouter()


class BrandCreate(BaseModel):
    nombre: str
    descripcion: str | None = None


class BrandUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class BrandResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None

    class Config:
        from_attributes = True


@router.get("", response_model=List[BrandResponse])
def list_brands(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Lista todas las marcas."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    brands = db.query(Marca).all()
    return brands


@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(
    brand_data: BrandCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crea una nueva marca."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    from datetime import datetime
    brand = Marca(
        nombre=brand_data.nombre,
        descripcion=brand_data.descripcion,
        fecha_creacion=datetime.utcnow()
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.get("/{brand_id}", response_model=BrandResponse)
def get_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtiene una marca por ID."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    brand = db.query(Marca).filter(Marca.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    return brand


@router.put("/{brand_id}", response_model=BrandResponse)
def update_brand(
    brand_id: int,
    brand_data: BrandUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualiza una marca."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    brand = db.query(Marca).filter(Marca.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    if brand_data.nombre is not None:
        brand.nombre = brand_data.nombre
    if brand_data.descripcion is not None:
        brand.descripcion = brand_data.descripcion
    
    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Elimina una marca."""
    # Verificar rol ADMIN
    role_names = [rol.nombre for rol in current_user.roles]
    if "ADMIN" not in role_names:
        raise HTTPException(status_code=403, detail="Se requiere el rol ADMIN")
    brand = db.query(Marca).filter(Marca.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    db.delete(brand)
    db.commit()
    return None

