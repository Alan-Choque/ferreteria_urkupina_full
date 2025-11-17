from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session

from app.models.categoria import Categoria
from app.models.marca import Marca
from app.models.variante_producto import UnidadMedida
from app.repositories.product_repo import ProductFilter, ProductRepository
from app.schemas.product import (
    BrandResponse,
    CategoryResponse,
    ProductCreateRequest,
    ProductListResponse,
    ProductMetaResponse,
    ProductResponse,
    ProductStatusUpdateRequest,
    ProductUpdateRequest,
    ProductImageResponse,
    UnitResponse,
    VariantResponse,
)


@dataclass(slots=True)
class ProductService:
    db: Session
    _repo: ProductRepository = field(init=False)

    def __post_init__(self) -> None:
        self._repo = ProductRepository(self.db)

    def _map_product(self, producto) -> ProductResponse:
        marca = BrandResponse.model_validate(producto.marca) if producto.marca else None
        categoria = CategoryResponse.model_validate(producto.categoria) if producto.categoria else None

        variantes = [
            VariantResponse(
                id=variante.id,
                nombre=variante.nombre,
                precio=float(variante.precio) if variante.precio is not None else None,
                unidad_medida_nombre=(
                    variante.unidad_medida.nombre if variante.unidad_medida else None
                ),
            )
            for variante in producto.variantes
        ]

        imagenes = [
            ProductImageResponse(
                id=imagen.id,
                url=imagen.url,
                descripcion=imagen.descripcion,
            )
            for imagen in producto.imagenes
        ]

        status = self._repo.determine_status(producto)

        return ProductResponse(
            id=producto.id,
            nombre=producto.nombre,
            descripcion=producto.descripcion,
            marca=marca,
            categoria=categoria,
            variantes=variantes,
            imagenes=imagenes,
            status=status,
        )

    def list_products(
        self,
        q: Optional[str],
        brand_id: Optional[int],
        category_id: Optional[int],
        status: Optional[str],
        page: int,
        page_size: int,
    ) -> ProductListResponse:
        filters = ProductFilter(search=q, brand_id=brand_id, category_id=category_id)
        productos, total = self._repo.list(filters, page, page_size)
        items = [self._map_product(producto) for producto in productos]

        if status:
            normalized = status.strip().upper()
            items = [item for item in items if item.status.upper() == normalized]
            total = len(items)

        return ProductListResponse(items=items, total=total, page=page, page_size=page_size)

    def get_product_by_slug(self, slug: str) -> ProductResponse | None:
        producto = self._repo.get_by_slug(slug)
        if not producto:
            return None
        return self._map_product(producto)

    def get_product_by_id(self, product_id: int) -> ProductResponse | None:
        producto = self._repo.get_by_id(product_id)
        if not producto:
            return None
        return self._map_product(producto)

    def list_variants_by_slug(self, slug: str) -> list[VariantResponse] | None:
        producto = self._repo.get_by_slug(slug)
        if not producto:
            return None
        return self._map_product(producto).variantes

    def list_variants_by_product_id(self, product_id: int) -> list[VariantResponse]:
        producto = self._repo.get_by_id(product_id)
        if not producto:
            return []
        return self._map_product(producto).variantes

    # ------------------------------------------------------------------
    # Admin operations
    # ------------------------------------------------------------------
    def create_product(self, payload: ProductCreateRequest) -> ProductResponse:
        producto = self._repo.create(payload.model_dump())
        return self._map_product(producto)

    def update_product(self, product_id: int, payload: ProductUpdateRequest) -> ProductResponse:
        producto = self._repo.get_by_id(product_id)
        if not producto:
            raise ValueError("Producto no encontrado")
        data = payload.model_dump(exclude_unset=True)
        producto = self._repo.update(producto, data)
        return self._map_product(producto)

    def set_product_status(self, product_id: int, payload: ProductStatusUpdateRequest) -> ProductResponse:
        producto = self._repo.get_by_id(product_id)
        if not producto:
            raise ValueError("Producto no encontrado")
        producto = self._repo.set_status(producto, payload.status)
        return self._map_product(producto)

    def fetch_meta(self) -> ProductMetaResponse:
        marcas = [BrandResponse.model_validate(marca) for marca in self.db.query(Marca).order_by(Marca.nombre.asc()).all()]
        categorias = [
            CategoryResponse.model_validate(categoria)
            for categoria in self.db.query(Categoria).order_by(Categoria.nombre.asc()).all()
        ]
        unidades = [
            UnitResponse.model_validate(unidad)
            for unidad in self.db.query(UnidadMedida).order_by(UnidadMedida.nombre.asc()).all()
        ]
        return ProductMetaResponse(marcas=marcas, categorias=categorias, unidades=unidades)
