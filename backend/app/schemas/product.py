from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator
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
    variantes: list[VariantResponse] = Field(default_factory=list)
    imagenes: list[ProductImageResponse] = Field(default_factory=list)

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


class ProductVariantCreate(BaseModel):
    nombre: Optional[str] = None
    unidad_medida_id: int
    precio: Optional[float] = None

    @field_validator("nombre")
    @classmethod
    def _strip_nombre(cls, value: Optional[str]):
        return value.strip() if isinstance(value, str) else value


class ProductVariantUpdate(ProductVariantCreate):
    id: Optional[int] = None
    delete: bool = False


class ProductImageCreate(BaseModel):
    url: str
    descripcion: Optional[str] = None

    @field_validator("url")
    @classmethod
    def _strip_url(cls, value: str) -> str:
        url = value.strip()
        if not url:
            raise ValueError("La URL de la imagen no puede estar vacía")
        return url


class ProductImageUpdate(ProductImageCreate):
    id: Optional[int] = None
    delete: bool = False


class ProductCreateRequest(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    categoria_id: Optional[int] = None
    marca_id: Optional[int] = None
    status: Optional[str] = Field(default="ACTIVE")
    variantes: list[ProductVariantCreate]
    imagenes: list[ProductImageCreate] = Field(default_factory=list)

    @field_validator("nombre")
    @classmethod
    def _strip_nombre(cls, value: str) -> str:
        nombre = value.strip()
        if not nombre:
            raise ValueError("El nombre del producto es obligatorio")
        return nombre

    @model_validator(mode="after")
    def _ensure_variants(self):
        if not self.variantes:
            raise ValueError("Debe registrar al menos una variante para el producto")
        return self


class ProductUpdateRequest(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria_id: Optional[int] = None
    marca_id: Optional[int] = None
    status: Optional[str] = None
    variantes: Optional[list[ProductVariantUpdate]] = None
    imagenes: Optional[list[ProductImageUpdate]] = None


class ProductStatusUpdateRequest(BaseModel):
    status: str = Field(pattern=r"^(ACTIVE|INACTIVE|activo|inactivo|Activo|Inactivo)$")


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int


class ProductDetailResponse(ProductResponse):
    """Respuesta detallada del producto."""
    pass


class UnitResponse(BaseModel):
    id: int
    nombre: str
    simbolo: Optional[str] = None

    class Config:
        from_attributes = True


class ProductMetaResponse(BaseModel):
    marcas: list[BrandResponse]
    categorias: list[CategoryResponse]
    unidades: list[UnitResponse]
