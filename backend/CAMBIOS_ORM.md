# Cambios ORM - Schema dbo y Relaciones Many-to-Many

## Resumen de Cambios

### 1. Schema dbo en todos los modelos

Todos los modelos ahora tienen:
```python
__table_args__ = {"schema": "dbo"}
```

Y todas las Foreign Keys usan formato completo:
```python
ForeignKey("dbo.productos.id")
ForeignKey("dbo.categorias.id")
ForeignKey("dbo.marcas.id")
# etc.
```

### 2. Relaciones Many-to-Many corregidas

**Problema anterior:** `Usuario.roles` usaba `secondary="usuarios_roles"` (string), causando `NoForeignKeysError`.

**Solución:** Crear objeto `Table` con schema `dbo`:

```python
usuarios_roles_table = Table(
    "usuarios_roles",
    Base.metadata,
    Column("usuario_id", Integer, ForeignKey("dbo.usuarios.id"), nullable=False),
    Column("rol_id", Integer, ForeignKey("dbo.roles.id"), nullable=False),
    PrimaryKeyConstraint("usuario_id", "rol_id"),
    schema="dbo"
)
```

Y usar en relaciones:
```python
roles: Mapped[list["Rol"]] = relationship(
    "Rol",
    secondary=usuarios_roles_table,  # objeto Table, no string
    back_populates="usuarios"
)
```

### 3. Alembic configurado para schema dbo

`alembic/env.py` ahora incluye:
- `version_table="alembic_version"`
- `version_table_schema="dbo"`
- `include_schemas=True`
- `compare_server_default=True`
- `include_object` que ignora schemas del sistema (`sys`, `INFORMATION_SCHEMA`)

### 4. Servicio de productos con fallback SQL

Si el ORM falla, `product_service.py` usa SQL directo como fallback:
- Usa schema explícito: `dbo.productos`, `dbo.variantes_producto`, etc.
- COUNT OVER() para total
- OFFSET/FETCH para paginación
- Logging de errores en JSON

### 5. Tests mínimos

`tests/test_products.py` incluye:
- Test de health endpoint
- Test de list products con formato correcto
- Test de filtros
- Test de paginación

## Comandos Post-Cambio

```bash
# 1. Reconstruir contenedor
docker compose up -d --build

# 2. Verificar conexión DB
docker compose exec api python scripts/db_ping.py

# 3. Verificar health endpoint
curl http://localhost:8000/api/v1/health

# 4. Test de productos con filtros
curl "http://localhost:8000/api/v1/products?page=1&page_size=10&q=perno"

# 5. Test de productos por brand
curl "http://localhost:8000/api/v1/products?brand_id=1&page=1&page_size=10"

# 6. Test de productos por category
curl "http://localhost:8000/api/v1/products?category_id=1&page=1&page_size=10"

# 7. Ejecutar tests
docker compose exec api pytest tests/test_products.py -v
```

## Columnas Asumidas

Ver `MODELOS_COLUMNAS.md` para lista completa de columnas asumidas en cada tabla.

**Importante:** Si alguna columna no coincide con tu base de datos real, ajusta el modelo correspondiente en `app/models/`.

## Estructura de Respuesta

### GET /api/v1/products

```json
{
  "items": [
    {
      "id": 1,
      "nombre": "Producto ejemplo",
      "descripcion": "Descripción",
      "slug": "producto-ejemplo",
      "image": "https://...",
      "short": "Descripción",
      "price": 100.50,
      "status": "ACTIVE",
      "marca": {"id": 1, "nombre": "Marca"},
      "categoria": {"id": 1, "nombre": "Categoría"},
      "variantes": [...],
      "imagenes": [...]
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 10
}
```

## Troubleshooting

### Error: "NoForeignKeysError"

- Verifica que las tablas de asociación usen objetos `Table` con schema `dbo`.
- Verifica que las Foreign Keys usen formato `"dbo.<tabla>.<columna>"`.

### Error: "Table 'xxx' not found"

- Verifica que el schema sea `dbo` en `__table_args__`.
- Verifica que el nombre de la tabla coincida exactamente con SQL.

### Error: "Column 'xxx' not found"

- Verifica que los nombres de columnas coincidan exactamente con SQL.
- Ver `MODELOS_COLUMNAS.md` para lista de columnas asumidas.

### Alembic no detecta cambios

- Verifica que `alembic/env.py` tenga `include_schemas=True`.
- Verifica que `version_table_schema="dbo"`.
- Ejecuta `alembic stamp head` si ya tienes el esquema.

