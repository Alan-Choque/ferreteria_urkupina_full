# Modelos ORM - Columnas Asumidas

Este documento lista las columnas que se asumieron en los modelos SQLAlchemy basándose en el esquema SQL existente.

## Tablas Principales

### `dbo.productos`
- `id` (int, IDENTITY)
- `categoria_id` (int, NULL, FK a dbo.categorias.id)
- `marca_id` (int, NULL, FK a dbo.marcas.id)
- `nombre` (nvarchar(100), NOT NULL)
- `descripcion` (nvarchar(255), NULL)
- `fecha_creacion` (datetime2(0), NOT NULL)

**Nota:** No hay campos `sku`, `slug`, `image`, `short`, `status` en la tabla. Estos se calculan en el schema Pydantic.

### `dbo.variantes_producto`
- `id` (int, IDENTITY)
- `producto_id` (int, NOT NULL, FK a dbo.productos.id)
- `nombre` (nvarchar(100), NULL)
- `unidad_medida_id` (int, NOT NULL, FK a dbo.unidades_medida.id)
- `precio` (decimal(10, 2), NULL)
- `fecha_creacion` (datetime2(0), NOT NULL)

**Nota:** El precio mínimo de las variantes se usa como `price` del producto en el catálogo.

### `dbo.imagenes_producto`
- `id` (int, IDENTITY)
- `producto_id` (int, NOT NULL, FK a dbo.productos.id)
- `url` (nvarchar(255), NOT NULL)
- `descripcion` (nvarchar(255), NULL)
- `fecha_creacion` (datetime2(0), NOT NULL)

**Nota:** La primera imagen se usa como `image` del producto.

### `dbo.categorias`
- `id` (int, IDENTITY)
- `nombre` (nvarchar(100), NOT NULL)
- `descripcion` (nvarchar(255), NULL)
- `fecha_creacion` (datetime2(0), NOT NULL)

### `dbo.marcas`
- `id` (int, IDENTITY)
- `nombre` (nvarchar(100), NOT NULL)
- `descripcion` (nvarchar(255), NULL)
- `fecha_creacion` (datetime2(0), NOT NULL)

### `dbo.usuarios`
- `id` (int, IDENTITY)
- `nombre_usuario` (nvarchar(50), NOT NULL, UNIQUE)
- `correo` (nvarchar(100), NOT NULL, UNIQUE)
- `hash_contrasena` (nvarchar(255), NOT NULL)
- `fecha_creacion` (datetime2(0), NOT NULL)
- `fecha_modificacion` (datetime2(0), NOT NULL)
- `activo` (bit, NOT NULL)

### `dbo.roles`
- `id` (int, IDENTITY)
- `nombre` (nvarchar(50), NOT NULL, UNIQUE)
- `descripcion` (nvarchar(255), NULL)

### `dbo.usuarios_roles` (tabla de asociación)
- `usuario_id` (int, NOT NULL, FK a dbo.usuarios.id, PK)
- `rol_id` (int, NOT NULL, FK a dbo.roles.id, PK)

**Nota:** Relación many-to-many implementada con objeto `Table` con schema `dbo`.

### `dbo.roles_permisos` (tabla de asociación)
- `rol_id` (int, NOT NULL, FK a dbo.roles.id, PK)
- `permiso_id` (int, NOT NULL, FK a dbo.permisos.id, PK)

### `dbo.unidades_medida`
- `id` (int, IDENTITY)
- `nombre` (nvarchar(50), NOT NULL)
- `simbolo` (nvarchar(10), NULL)
- `descripcion` (nvarchar(255), NULL)
- `fecha_creacion` (datetime2(0), NOT NULL)

### `dbo.producto_almacen` (stock)
- `id` (int, IDENTITY)
- `variante_producto_id` (int, NOT NULL, FK a dbo.variantes_producto.id)
- `almacen_id` (int, NOT NULL, FK a dbo.almacenes.id)
- `cantidad_disponible` (decimal(10, 2), NOT NULL)
- `costo_promedio` (decimal(10, 2), NULL)
- `fecha_actualizacion` (datetime2(0), NOT NULL)

## Campos Calculados en Schemas (no existen en DB)

### `ProductResponse` (schema Pydantic)
- `sku`: `None` (no existe en DB)
- `slug`: Calculado desde `nombre` usando `slugify`
- `image`: Primera imagen de `dbo.imagenes_producto` (url)
- `short`: Igual a `descripcion`
- `price`: `MIN(precio)` de `dbo.variantes_producto` para el producto
- `status`: `"ACTIVE"` (hardcoded, no existe en DB)

## Foreign Keys

Todas las Foreign Keys usan el formato completo con schema:
- `ForeignKey("dbo.<tabla>.<columna>")`

Ejemplos:
- `ForeignKey("dbo.productos.id")`
- `ForeignKey("dbo.categorias.id")`
- `ForeignKey("dbo.marcas.id")`
- `ForeignKey("dbo.usuarios.id")`
- `ForeignKey("dbo.roles.id")`

## Schema dbo

Todos los modelos tienen:
```python
__table_args__ = {"schema": "dbo"}
```

Y las tablas de asociación (many-to-many) también:
```python
usuarios_roles_table = Table(
    "usuarios_roles",
    Base.metadata,
    ...,
    schema="dbo"
)
```

## Ajustes Necesarios

Si encuentras diferencias entre estos modelos y tu base de datos real:

1. **Verificar nombres de columnas**: Asegúrate de que los nombres coincidan exactamente.
2. **Verificar tipos**: Los tipos de SQLAlchemy deben coincidir con los de SQL Server.
3. **Verificar Foreign Keys**: Todas deben usar `"dbo.<tabla>.<columna>"`.
4. **Verificar relaciones**: Las relaciones many-to-many deben usar objetos `Table` con schema `dbo`.

## Fallback SQL

Si el ORM falla, el servicio `product_service.py` usa SQL directo como fallback. Las queries SQL usan:
- Schema explícito: `dbo.productos`, `dbo.variantes_producto`, etc.
- COUNT OVER() para total
- OFFSET/FETCH para paginación
- JOINs LEFT para obtener marca y categoría

