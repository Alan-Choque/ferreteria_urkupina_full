import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, text, func
from sqlalchemy.orm import joinedload
from app.models.producto import Producto
from app.models.marca import Marca
from app.models.categoria import Categoria
from app.models.variante_producto import VarianteProducto
from app.models.imagen_producto import ImagenProducto
from app.schemas.product import (
    ProductResponse, ProductListResponse, VariantResponse, ProductImageResponse,
    BrandResponse, CategoryResponse
)
from slugify import slugify

logger = logging.getLogger(__name__)


def list_products(
    db: Session,
    q: Optional[str] = None,
    brand_id: Optional[int] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> ProductListResponse:
    """Lista productos con filtros y paginación. Usa SQL directo como fallback si ORM falla."""
    try:
        # Intentar con ORM primero
        return _list_products_orm(db, q, brand_id, category_id, status, page, page_size)
    except Exception as e:
        logger.error(f"Error en ORM, usando fallback SQL: {e}", exc_info=True)
        # Fallback a SQL directo
        return _list_products_sql(db, q, brand_id, category_id, status, page, page_size)


def _list_products_orm(
    db: Session,
    q: Optional[str] = None,
    brand_id: Optional[int] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> ProductListResponse:
    """Lista productos usando ORM."""
    query = db.query(Producto).options(
        joinedload(Producto.marca),
        joinedload(Producto.categoria),
        joinedload(Producto.variantes),
        joinedload(Producto.imagenes)
    )
    
    # Filtros
    if q:
        query = query.filter(
            or_(
                Producto.nombre.ilike(f"%{q}%"),
                Producto.descripcion.ilike(f"%{q}%")
            )
        )
    if brand_id:
        query = query.filter(Producto.marca_id == brand_id)
    if category_id:
        query = query.filter(Producto.categoria_id == category_id)
    # status no está en el modelo, pero lo mantenemos por compatibilidad
    
    # Paginación
    total = query.count()
    offset = (page - 1) * page_size
    products = query.offset(offset).limit(page_size).all()
    
    # Convertir a schemas
    items = []
    for p in products:
        # Mapear variantes
        variantes = []
        for v in p.variantes:
            variantes.append(VariantResponse(
                id=v.id,
                nombre=v.nombre,
                precio=float(v.precio) if v.precio else None,
                unidad_medida_nombre=v.unidad_medida.nombre if v.unidad_medida else None
            ))
        
        # Mapear imágenes
        imagenes = []
        for img in p.imagenes:
            imagenes.append(ProductImageResponse(
                id=img.id,
                url=img.url,
                descripcion=img.descripcion
            ))
        
        # Crear respuesta
        product_resp = ProductResponse(
            id=p.id,
            nombre=p.nombre,
            descripcion=p.descripcion,
            marca=BrandResponse(id=p.marca.id, nombre=p.marca.nombre) if p.marca else None,
            categoria=CategoryResponse(id=p.categoria.id, nombre=p.categoria.nombre) if p.categoria else None,
            variantes=variantes,
            imagenes=imagenes
        )
        items.append(product_resp)
    
    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


def _list_products_sql(
    db: Session,
    q: Optional[str] = None,
    brand_id: Optional[int] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> ProductListResponse:
    """Lista productos usando SQL directo (fallback)."""
    offset = (page - 1) * page_size
    
    # Construir WHERE dinámicamente
    where_clauses = []
    params = {}
    
    if q:
        where_clauses.append("(p.nombre LIKE :q OR p.descripcion LIKE :q)")
        params["q"] = f"%{q}%"
    
    if brand_id:
        where_clauses.append("p.marca_id = :brand_id")
        params["brand_id"] = brand_id
    
    if category_id:
        where_clauses.append("p.categoria_id = :category_id")
        params["category_id"] = category_id
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Query principal con COUNT OVER() para total
    sql_query = text(f"""
        SELECT 
            p.id,
            p.nombre,
            p.descripcion,
            p.categoria_id,
            p.marca_id,
            m.nombre AS marca_nombre,
            c.nombre AS categoria_nombre,
            (
                SELECT MIN(v.precio)
                FROM dbo.variantes_producto v
                WHERE v.producto_id = p.id AND v.precio IS NOT NULL
            ) AS precio_min,
            (
                SELECT TOP 1 img.url
                FROM dbo.imagenes_producto img
                WHERE img.producto_id = p.id
                ORDER BY img.id
            ) AS imagen_url,
            COUNT(*) OVER() AS total_count
        FROM dbo.productos p
        LEFT JOIN dbo.marcas m ON p.marca_id = m.id
        LEFT JOIN dbo.categorias c ON p.categoria_id = c.id
        WHERE {where_sql}
        ORDER BY p.id
        OFFSET :offset ROWS
        FETCH NEXT :page_size ROWS ONLY
    """)
    
    params["offset"] = offset
    params["page_size"] = page_size
    
    result = db.execute(sql_query, params)
    rows = result.fetchall()
    
    # Obtener total del primer row (si existe)
    total = rows[0].total_count if rows else 0
    
    # Convertir a ProductResponse
    items = []
    for row in rows:
        # Obtener variantes para este producto
        variantes_sql = text("""
            SELECT id, nombre, precio, unidad_medida_id
            FROM dbo.variantes_producto
            WHERE producto_id = :product_id
        """)
        variantes_result = db.execute(variantes_sql, {"product_id": row.id})
        variantes = []
        for v_row in variantes_result:
            variantes.append(VariantResponse(
                id=v_row.id,
                nombre=v_row.nombre,
                precio=float(v_row.precio) if v_row.precio else None,
                unidad_medida_nombre=None  # Necesitaríamos JOIN con unidades_medida
            ))
        
        # Obtener imágenes para este producto
        imagenes_sql = text("""
            SELECT id, url, descripcion
            FROM dbo.imagenes_producto
            WHERE producto_id = :product_id
        """)
        imagenes_result = db.execute(imagenes_sql, {"product_id": row.id})
        imagenes = []
        for img_row in imagenes_result:
            imagenes.append(ProductImageResponse(
                id=img_row.id,
                url=img_row.url,
                descripcion=img_row.descripcion
            ))
        
        # Crear ProductResponse
        product_resp = ProductResponse(
            id=row.id,
            nombre=row.nombre,
            descripcion=row.descripcion,
            marca=BrandResponse(id=row.marca_id, nombre=row.marca_nombre) if row.marca_id and row.marca_nombre else None,
            categoria=CategoryResponse(id=row.categoria_id, nombre=row.categoria_nombre) if row.categoria_id and row.categoria_nombre else None,
            variantes=variantes,
            imagenes=imagenes
        )
        # price ya está calculado en precio_min
        if row.precio_min:
            product_resp.price = float(row.precio_min)
        # image ya está en imagen_url
        if row.imagen_url:
            product_resp.image = row.imagen_url
        
        items.append(product_resp)
    
    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


def get_product_by_slug(db: Session, slug: str) -> Optional[ProductResponse]:
    """Obtiene un producto por slug."""
    try:
        # Intentar con ORM
        products = db.query(Producto).options(
            joinedload(Producto.marca),
            joinedload(Producto.categoria),
            joinedload(Producto.variantes).joinedload(VarianteProducto.unidad_medida),
            joinedload(Producto.imagenes)
        ).all()
        
        for p in products:
            if slugify(p.nombre) == slug:
                # Mapear variantes
                variantes = []
                for v in p.variantes:
                    variantes.append(VariantResponse(
                        id=v.id,
                        nombre=v.nombre,
                        precio=float(v.precio) if v.precio else None,
                        unidad_medida_nombre=v.unidad_medida.nombre if v.unidad_medida else None
                    ))
                
                # Mapear imágenes
                imagenes = []
                for img in p.imagenes:
                    imagenes.append(ProductImageResponse(
                        id=img.id,
                        url=img.url,
                        descripcion=img.descripcion
                    ))
                
                return ProductResponse(
                    id=p.id,
                    nombre=p.nombre,
                    descripcion=p.descripcion,
                    marca=BrandResponse(id=p.marca.id, nombre=p.marca.nombre) if p.marca else None,
                    categoria=CategoryResponse(id=p.categoria.id, nombre=p.categoria.nombre) if p.categoria else None,
                    variantes=variantes,
                    imagenes=imagenes
                )
        
        return None
    except Exception as e:
        logger.error(f"Error en ORM, usando fallback SQL: {e}", exc_info=True)
        # Fallback SQL
        return _get_product_by_slug_sql(db, slug)


def _get_product_by_slug_sql(db: Session, slug: str) -> Optional[ProductResponse]:
    """Obtiene producto por slug usando SQL directo."""
    # Buscar por nombre (slug se genera desde nombre)
    sql_query = text("""
        SELECT 
            p.id,
            p.nombre,
            p.descripcion,
            p.categoria_id,
            p.marca_id,
            m.nombre AS marca_nombre,
            c.nombre AS categoria_nombre
        FROM dbo.productos p
        LEFT JOIN dbo.marcas m ON p.marca_id = m.id
        LEFT JOIN dbo.categorias c ON p.categoria_id = c.id
    """)
    
    result = db.execute(sql_query)
    rows = result.fetchall()
    
    for row in rows:
        if slugify(row.nombre) == slug:
            # Obtener variantes e imágenes (igual que en _list_products_sql)
            variantes_sql = text("""
                SELECT id, nombre, precio
                FROM dbo.variantes_producto
                WHERE producto_id = :product_id
            """)
            variantes_result = db.execute(variantes_sql, {"product_id": row.id})
            variantes = []
            for v_row in variantes_result:
                variantes.append(VariantResponse(
                    id=v_row.id,
                    nombre=v_row.nombre,
                    precio=float(v_row.precio) if v_row.precio else None,
                    unidad_medida_nombre=None
                ))
            
            imagenes_sql = text("""
                SELECT id, url, descripcion
                FROM dbo.imagenes_producto
                WHERE producto_id = :product_id
            """)
            imagenes_result = db.execute(imagenes_sql, {"product_id": row.id})
            imagenes = []
            for img_row in imagenes_result:
                imagenes.append(ProductImageResponse(
                    id=img_row.id,
                    url=img_row.url,
                    descripcion=img_row.descripcion
                ))
            
            return ProductResponse(
                id=row.id,
                nombre=row.nombre,
                descripcion=row.descripcion,
                marca=BrandResponse(id=row.marca_id, nombre=row.marca_nombre) if row.marca_id and row.marca_nombre else None,
                categoria=CategoryResponse(id=row.categoria_id, nombre=row.categoria_nombre) if row.categoria_id and row.categoria_nombre else None,
                variantes=variantes,
                imagenes=imagenes
            )
    
    return None


def get_product_by_id(db: Session, product_id: int) -> Optional[ProductResponse]:
    """Obtiene un producto por ID."""
    try:
        p = db.query(Producto).options(
            joinedload(Producto.marca),
            joinedload(Producto.categoria),
            joinedload(Producto.variantes).joinedload(VarianteProducto.unidad_medida),
            joinedload(Producto.imagenes)
        ).filter(Producto.id == product_id).first()
        
        if not p:
            return None
        
        # Mapear variantes
        variantes = []
        for v in p.variantes:
            variantes.append(VariantResponse(
                id=v.id,
                nombre=v.nombre,
                precio=float(v.precio) if v.precio else None,
                unidad_medida_nombre=v.unidad_medida.nombre if v.unidad_medida else None
            ))
        
        # Mapear imágenes
        imagenes = []
        for img in p.imagenes:
            imagenes.append(ProductImageResponse(
                id=img.id,
                url=img.url,
                descripcion=img.descripcion
            ))
        
        return ProductResponse(
            id=p.id,
            nombre=p.nombre,
            descripcion=p.descripcion,
            marca=BrandResponse(id=p.marca.id, nombre=p.marca.nombre) if p.marca else None,
            categoria=CategoryResponse(id=p.categoria.id, nombre=p.categoria.nombre) if p.categoria else None,
            variantes=variantes,
            imagenes=imagenes
        )
    except Exception as e:
        logger.error(f"Error en ORM, usando fallback SQL: {e}", exc_info=True)
        # Fallback SQL
        sql_query = text("""
            SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.categoria_id,
                p.marca_id,
                m.nombre AS marca_nombre,
                c.nombre AS categoria_nombre
            FROM dbo.productos p
            LEFT JOIN dbo.marcas m ON p.marca_id = m.id
            LEFT JOIN dbo.categorias c ON p.categoria_id = c.id
            WHERE p.id = :product_id
        """)
        result = db.execute(sql_query, {"product_id": product_id})
        row = result.fetchone()
        
        if not row:
            return None
        
        # Obtener variantes e imágenes (igual que antes)
        variantes_sql = text("""
            SELECT id, nombre, precio
            FROM dbo.variantes_producto
            WHERE producto_id = :product_id
        """)
        variantes_result = db.execute(variantes_sql, {"product_id": product_id})
        variantes = []
        for v_row in variantes_result:
            variantes.append(VariantResponse(
                id=v_row.id,
                nombre=v_row.nombre,
                precio=float(v_row.precio) if v_row.precio else None,
                unidad_medida_nombre=None
            ))
        
        imagenes_sql = text("""
            SELECT id, url, descripcion
            FROM dbo.imagenes_producto
            WHERE producto_id = :product_id
        """)
        imagenes_result = db.execute(imagenes_sql, {"product_id": product_id})
        imagenes = []
        for img_row in imagenes_result:
            imagenes.append(ProductImageResponse(
                id=img_row.id,
                url=img_row.url,
                descripcion=img_row.descripcion
            ))
        
        return ProductResponse(
            id=row.id,
            nombre=row.nombre,
            descripcion=row.descripcion,
            marca=BrandResponse(id=row.marca_id, nombre=row.marca_nombre) if row.marca_id and row.marca_nombre else None,
            categoria=CategoryResponse(id=row.categoria_id, nombre=row.categoria_nombre) if row.categoria_id and row.categoria_nombre else None,
            variantes=variantes,
            imagenes=imagenes
        )


def list_variants_by_slug(db: Session, slug: str) -> Optional[list[VariantResponse]]:
    """Lista variantes de un producto por slug."""
    product = get_product_by_slug(db, slug)
    if not product:
        return None
    return product.variantes


def list_variants_by_product_id(db: Session, product_id: int) -> list[VariantResponse]:
    """Lista variantes de un producto por ID."""
    product = get_product_by_id(db, product_id)
    if not product:
        return []
    return product.variantes
