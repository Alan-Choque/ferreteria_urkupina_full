from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Sequence

from slugify import slugify
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.atributo import Atributo, ValorAtributoVariante
from app.models.imagen_producto import ImagenProducto
from app.models.producto import Producto
from app.models.variante_producto import VarianteProducto


_STATUS_ATTRIBUTE_NAME = "estado_producto"
_DEFAULT_STATUS = "ACTIVE"


@dataclass(slots=True)
class ProductFilter:
    search: str | None = None
    brand_id: int | None = None
    category_id: int | None = None


class ProductRepository:
    """Capa de acceso a datos para productos y variantes."""

    def __init__(self, db: Session):
        self._db = db

    def _base_stmt(self):
        return (
            select(Producto)
            .options(
                joinedload(Producto.marca),
                joinedload(Producto.categoria),
                joinedload(Producto.variantes)
                .joinedload(VarianteProducto.unidad_medida),
                joinedload(Producto.variantes)
                .joinedload(VarianteProducto.valores_atributos)
                .joinedload(ValorAtributoVariante.atributo),
                joinedload(Producto.imagenes),
            )
        )

    def _apply_filters(self, stmt, filters: ProductFilter):
        conditions: list = []
        if filters.search:
            like = f"%{filters.search.strip()}%"
            conditions.append(
                or_(
                    Producto.nombre.ilike(like),
                    Producto.descripcion.ilike(like),
                )
            )
        if filters.brand_id:
            conditions.append(Producto.marca_id == filters.brand_id)
        if filters.category_id:
            conditions.append(Producto.categoria_id == filters.category_id)

        if conditions:
            stmt = stmt.where(*conditions)
        return stmt

    def list(
        self,
        filters: ProductFilter,
        page: int,
        page_size: int,
    ) -> tuple[list[Producto], int]:
        stmt = self._apply_filters(self._base_stmt(), filters)
        stmt = stmt.order_by(Producto.fecha_creacion.desc())

        total_stmt = select(func.count()).select_from(Producto)
        total_stmt = self._apply_filters(total_stmt, filters)
        total = self._db.scalar(total_stmt) or 0

        result = self._db.scalars(
            stmt.offset((page - 1) * page_size).limit(page_size)
        )
        rows: Sequence[Producto] = result.unique().all()
        return list(rows), total

    def get_by_id(self, product_id: int) -> Producto | None:
        stmt = self._base_stmt().where(Producto.id == product_id)
        return self._db.scalars(stmt).first()

    def _match_by_slug(self, slug: str, productos: Iterable[Producto]) -> Producto | None:
        # Normalizar el slug de búsqueda (lowercase, sin espacios extra)
        slug_normalized = slug.lower().strip()
        
        for producto in productos:
            nombre = producto.nombre or ""
            # Generar slug del nombre del producto
            producto_slug = slugify(nombre).lower().strip()
            
            # Comparación exacta
            if producto_slug == slug_normalized:
                return producto
            
            # Comparación flexible: sin guiones
            if producto_slug.replace("-", "") == slug_normalized.replace("-", ""):
                return producto
            
            # Comparación flexible: espacios en lugar de guiones
            if producto_slug.replace("-", " ") == slug_normalized.replace("-", " "):
                return producto
            
            # Comparación flexible: normalizar múltiples guiones
            producto_slug_normalized = "-".join(filter(None, producto_slug.split("-")))
            slug_search_normalized = "-".join(filter(None, slug_normalized.split("-")))
            if producto_slug_normalized == slug_search_normalized:
                return producto
        
        return None

    def get_by_slug(self, slug: str) -> Producto | None:
        # Si el slug es un número, intentar buscar directamente por ID
        if slug.isdigit():
            return self.get_by_id(int(slug))
        
        # Normalizar el slug
        slug_normalized = slug.lower().strip()
        
        # Primero intentar búsqueda directa en todos los productos (más rápido si hay pocos)
        all_products = self._db.scalars(self._base_stmt()).unique().all()
        match = self._match_by_slug(slug_normalized, all_products)
        if match:
            return match
        
        # Si no se encuentra, intentar búsqueda aproximada por texto
        search = slug_normalized.replace("-", " ")
        stmt = self._apply_filters(self._base_stmt(), ProductFilter(search=search))
        candidates: Iterable[Producto] = self._db.scalars(stmt).unique().all()
        match = self._match_by_slug(slug_normalized, candidates)
        if match:
            return match

        # Último intento: buscar en todos los productos de nuevo (por si acaso)
        return self._match_by_slug(slug_normalized, all_products)

    def list_variants(self, product_id: int) -> list[VarianteProducto]:
        stmt = (
            select(VarianteProducto)
            .options(joinedload(VarianteProducto.unidad_medida))
            .where(VarianteProducto.producto_id == product_id)
            .order_by(VarianteProducto.id.asc())
        )
        return list(self._db.scalars(stmt).all())

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------
    @staticmethod
    def _normalize_status(status: str | None) -> str:
        if not status:
            return _DEFAULT_STATUS
        value = status.strip().upper()
        if value in {"INACTIVO", "INACTIVA", "INACTIVE", "DISABLED", "OFF"}:
            return "INACTIVE"
        return _DEFAULT_STATUS

    def _get_status_attribute(self) -> Atributo:
        atributo = (
            self._db.query(Atributo)
            .filter(Atributo.nombre == _STATUS_ATTRIBUTE_NAME)
            .first()
        )
        if atributo:
            return atributo
        atributo = Atributo(
            nombre=_STATUS_ATTRIBUTE_NAME,
            descripcion="Estado lógico del producto (ACTIVE/INACTIVE)",
            fecha_creacion=datetime.utcnow(),
        )
        self._db.add(atributo)
        self._db.flush()
        return atributo

    def _apply_status(self, producto: Producto, status: str) -> None:
        atributo = self._get_status_attribute()
        normalized = self._normalize_status(status)
        for variante in producto.variantes:
            existing = next(
                (valor for valor in variante.valores_atributos if valor.atributo_id == atributo.id),
                None,
            )
            if existing:
                existing.valor = normalized
            else:
                variante.valores_atributos.append(
                    ValorAtributoVariante(atributo=atributo, valor=normalized)
                )

    def determine_status(self, producto: Producto) -> str:
        statuses: set[str] = set()
        for variante in producto.variantes:
            for valor in variante.valores_atributos:
                if valor.atributo.nombre == _STATUS_ATTRIBUTE_NAME:
                    statuses.add(self._normalize_status(valor.valor))
        if not statuses:
            return _DEFAULT_STATUS
        if statuses == {"INACTIVE"}:
            return "INACTIVE"
        if "ACTIVE" in statuses:
            return "ACTIVE"
        return statuses.pop()

    def create(self, data: dict) -> Producto:
        now = datetime.utcnow()
        producto = Producto(
            nombre=data["nombre"],
            descripcion=data.get("descripcion"),
            categoria_id=data.get("categoria_id"),
            marca_id=data.get("marca_id"),
            fecha_creacion=now,
        )

        for variante_data in data.get("variantes", []) or []:
            variante = VarianteProducto(
                nombre=variante_data.get("nombre"),
                unidad_medida_id=variante_data["unidad_medida_id"],
                precio=variante_data.get("precio"),
                fecha_creacion=now,
            )
            producto.variantes.append(variante)

        for imagen_data in data.get("imagenes", []) or []:
            producto.imagenes.append(
                ImagenProducto(
                    url=imagen_data["url"],
                    descripcion=imagen_data.get("descripcion"),
                    fecha_creacion=now,
                )
            )

        self._db.add(producto)
        self._db.flush()

        self._apply_status(producto, data.get("status", _DEFAULT_STATUS))

        self._db.commit()
        self._db.refresh(producto)
        return producto

    def update(self, producto: Producto, data: dict) -> Producto:
        for field in ("nombre", "descripcion", "categoria_id", "marca_id"):
            if field in data and data[field] is not None:
                setattr(producto, field, data[field])

        now = datetime.utcnow()

        if "variantes" in data:
            existing_variants = {variante.id: variante for variante in producto.variantes}
            for variante_data in data.get("variantes") or []:
                variant_id = variante_data.get("id")
                remove = bool(variante_data.get("delete"))
                if variant_id and variant_id in existing_variants:
                    variante = existing_variants[variant_id]
                    if remove:
                        self._db.delete(variante)
                        continue
                    if "nombre" in variante_data:
                        variante.nombre = variante_data.get("nombre")
                    if "unidad_medida_id" in variante_data and variante_data.get("unidad_medida_id") is not None:
                        variante.unidad_medida_id = variante_data.get("unidad_medida_id")
                    if "precio" in variante_data:
                        variante.precio = variante_data.get("precio")
                elif not variant_id and not remove:
                    nueva = VarianteProducto(
                        nombre=variante_data.get("nombre"),
                        unidad_medida_id=variante_data["unidad_medida_id"],
                        precio=variante_data.get("precio"),
                        fecha_creacion=now,
                    )
                    producto.variantes.append(nueva)

        if "imagenes" in data:
            existing_images = {imagen.id: imagen for imagen in producto.imagenes}
            for imagen_data in data.get("imagenes") or []:
                image_id = imagen_data.get("id")
                remove = bool(imagen_data.get("delete"))
                if image_id and image_id in existing_images:
                    imagen = existing_images[image_id]
                    if remove:
                        self._db.delete(imagen)
                        continue
                    if "url" in imagen_data and imagen_data.get("url"):
                        imagen.url = imagen_data.get("url")
                    if "descripcion" in imagen_data:
                        imagen.descripcion = imagen_data.get("descripcion")
                elif not image_id and not remove:
                    producto.imagenes.append(
                        ImagenProducto(
                            url=imagen_data["url"],
                            descripcion=imagen_data.get("descripcion"),
                            fecha_creacion=now,
                        )
                    )

        if "status" in data and data.get("status") is not None:
            self._apply_status(producto, data.get("status"))

        self._db.add(producto)
        self._db.commit()
        self._db.refresh(producto)
        return producto

    def set_status(self, producto: Producto, status: str) -> Producto:
        self._apply_status(producto, status)
        self._db.add(producto)
        self._db.commit()
        self._db.refresh(producto)
        return producto


__all__ = ["ProductRepository", "ProductFilter"]
