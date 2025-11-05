from typing import Optional
from pydantic import BaseModel, model_validator
from slugify import slugify


class BrandResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class VariantResponse(BaseModel):
    id: int
    nombre: Optional[str]
    precio: Optional[float]
    unidad_medida_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class ProductImageResponse(BaseModel):
    id: int
    url: str
    descripcion: Optional[str]

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    marca: Optional[BrandResponse] = None
    categoria: Optional[CategoryResponse] = None
    
    # Campos calculados para compatibilidad con UI
    sku: Optional[str] = None
    slug: str = ""
    image: Optional[str] = None
    short: Optional[str] = None
    price: Optional[float] = None
    status: str = "ACTIVE"
    
    # Campos adicionales
    variantes: list[VariantResponse] = []
    imagenes: list[ProductImageResponse] = []

    @model_validator(mode="after")
    def compute_fields(self):
        """Calcula campos adicionales para compatibilidad con UI."""
        # Slug
        self.slug = slugify(self.nombre)
        
        # Image (primera imagen)
        if self.imagenes and len(self.imagenes) > 0:
            self.image = self.imagenes[0].url
        
        # Short (descripción corta)
        self.short = self.descripcion
        
        # Price (precio mínimo de variantes)
        if self.variantes:
            precios = [v.precio for v in self.variantes if v.precio is not None]
            if precios:
                self.price = min(precios)
        
        return self

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int


class ProductDetailResponse(ProductResponse):
    """Respuesta detallada del producto."""
    pass
