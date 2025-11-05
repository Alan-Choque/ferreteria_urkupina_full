# Ferretería Urkupina — Backend (FastAPI)

Backend API para el sistema de gestión de ferretería, construido con FastAPI, SQLAlchemy 2.x, Alembic y SQL Server.

## Estructura del Proyecto

```
backend/
├── app/
│   ├── api/v1/          # Endpoints API v1
│   │   ├── auth.py      # Autenticación JWT
│   │   ├── products.py  # Catálogo público
│   │   ├── inventory.py # Inventario
│   │   └── admin/       # Endpoints admin (CRUD)
│   ├── core/            # Configuración y seguridad
│   ├── db/               # Base de datos y sesiones
│   ├── models/           # Modelos SQLAlchemy 1:1 con SQL
│   ├── schemas/          # Schemas Pydantic (DTOs)
│   ├── services/         # Lógica de negocio
│   └── main.py           # Aplicación FastAPI
├── alembic/              # Migraciones
├── scripts/              # Scripts de utilidad
├── tests/                 # Tests
├── docker-compose.yml     # Docker compose
├── Dockerfile            # Dockerfile para API
└── requirements.txt       # Dependencias Python
```

## Requisitos

- Docker y Docker Compose
- Python 3.11+ (para desarrollo local)
- **SQL Server en Windows host** (no en Docker)

## Configuración: Windows Host SQL Server

Este proyecto está configurado para conectarse a **SQL Server en el host Windows** desde el contenedor Docker.

### Prerrequisitos

1. **SQL Server** debe estar corriendo en Windows con:
   - Puerto **1433** abierto
   - Usuario SQL: `ferre` con contraseña `YourStrong!Passw0rd`
   - Base de datos: `AdventureWorks2022` o `ferreteria_urkupina`

2. **Firewall de Windows**:
   - Permitir conexiones TCP en el puerto 1433
   - Configurar regla de firewall para SQL Server

3. **SQL Server Authentication**:
   - Habilitar autenticación mixta (Windows + SQL)
   - Crear usuario SQL `ferre` si no existe

### Configurar conexión

1. **Crear archivo `.env`**:

```bash
cp .env.example .env
```

2. **Editar `.env`** con la conexión correcta:

```env
DATABASE_URL=mssql+pyodbc://ferre:YourStrong!Passw0rd@host.docker.internal:1433/AdventureWorks2022?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no&TrustServerCertificate=yes
```

**Nota importante:**
- `host.docker.internal` es el hostname especial de Docker para acceder al host Windows
- `Encrypt=no&TrustServerCertificate=yes` son necesarios para ODBC Driver 18
- Si usas otra base de datos, cambia `AdventureWorks2022` por el nombre de tu DB

## Quickstart

### 1. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tu DATABASE_URL correcta
```

### 2. Levantar API con Docker

```bash
docker compose up -d --build
```

Esto levanta:
- **API FastAPI** (puerto 8000)
- **No levanta SQL Server** - usa el del host Windows

### 3. Verificar conexión a la base de datos

```bash
# Test de conexión
docker compose exec api python scripts/db_ping.py
# Debe imprimir: DB OK
```

### 4. Configurar Alembic (si el esquema ya existe)

Si tu base de datos ya tiene tablas, marca Alembic como sincronizado:

```bash
# Primera vez: marcar como sincronizado (no crea tablas)
docker compose exec api alembic stamp head

# Verificar estado
docker compose exec api alembic current
```

### 5. Verificar que funciona

```bash
# Health check
curl http://localhost:8000/api/v1/health
# Debe retornar: {"status":"ok"}

# Documentación API
# Abre http://localhost:8000/docs en tu navegador
```

## Desarrollo Local (sin Docker)

### Instalar dependencias

```bash
pip install -r requirements.txt
```

### Configurar variables de entorno

```bash
# Windows PowerShell
$env:DATABASE_URL="mssql+pyodbc://ferre:YourStrong!Passw0rd@localhost:1433/AdventureWorks2022?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no&TrustServerCertificate=yes"
$env:JWT_SECRET="your-secret-key"
$env:CORS_ORIGINS_RAW="http://localhost:3000"

# Linux/Mac
export DATABASE_URL="mssql+pyodbc://ferre:YourStrong!Passw0rd@localhost:1433/AdventureWorks2022?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no&TrustServerCertificate=yes"
export JWT_SECRET="your-secret-key"
export CORS_ORIGINS_RAW="http://localhost:3000"
```

### Ejecutar servidor de desarrollo

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Migraciones Alembic

### Situación inicial: Base de datos con esquema existente

Si tu base de datos **ya tiene tablas** (por ejemplo, desde `inputs/db/ferreteria.sql`):

1. **Conectar y verificar**:
```bash
docker compose exec api python scripts/db_ping.py
```

2. **Marcar como sincronizado** (sin crear tablas):
```bash
docker compose exec api alembic stamp head
```

3. **Verificar estado**:
```bash
docker compose exec api alembic current
```

**⚠️ Importante:** No ejecutes `alembic upgrade head` si las tablas ya existen, a menos que quieras crear migraciones nuevas.

### Crear una nueva migración

```bash
# Desde Docker
docker compose exec api alembic revision --autogenerate -m "descripción del cambio"

# Localmente
alembic revision --autogenerate -m "descripción del cambio"
```

### Aplicar migraciones

```bash
# Desde Docker
docker compose exec api alembic upgrade head

# Localmente
alembic upgrade head
```

### Revertir última migración

```bash
docker compose exec api alembic downgrade -1
```

### Reporte de diferencias

Si hay diferencias entre modelos y DB, se puede generar un reporte:

```bash
docker compose exec api alembic revision --autogenerate -m "check-diff" --sql
# Revisar la salida y crear backend/ALEMBIC_DIFF.md si es necesario
```

## Endpoints API

### Públicos (Catálogo)

- `GET /api/v1/products` - Lista productos con filtros
- `GET /api/v1/products/{slug}` - Obtiene producto por slug
- `GET /api/v1/products/by-id/{id}` - Obtiene producto por ID (temporal)
- `GET /api/v1/products/{slug}/variants` - Lista variantes de un producto
- `GET /api/v1/inventory/stock/{variant_id}` - Stock de una variante

### Autenticación

- `POST /api/v1/auth/login` - Login (email + password → tokens)
- `POST /api/v1/auth/refresh` - Refrescar token
- `GET /api/v1/auth/me` - Información del usuario actual

### Admin (Requiere JWT + rol ADMIN)

- `GET /api/v1/admin/brands` - Lista marcas
- `POST /api/v1/admin/brands` - Crea marca
- `GET /api/v1/admin/brands/{id}` - Obtiene marca
- `PUT /api/v1/admin/brands/{id}` - Actualiza marca
- `DELETE /api/v1/admin/brands/{id}` - Elimina marca

- `GET /api/v1/admin/categories` - Lista categorías
- `POST /api/v1/admin/categories` - Crea categoría
- `GET /api/v1/admin/categories/{id}` - Obtiene categoría
- `PUT /api/v1/admin/categories/{id}` - Actualiza categoría
- `DELETE /api/v1/admin/categories/{id}` - Elimina categoría

## Autenticación JWT

### Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

Respuesta:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Usar token en requests

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Modelos SQLAlchemy

Los modelos están en `app/models/` y son 1:1 con el esquema SQL en `inputs/db/ferreteria.sql`.

Modelos principales:
- `Producto` → `productos`
- `VarianteProducto` → `variantes_producto`
- `Categoria` → `categorias`
- `Marca` → `marcas`
- `Usuario` → `usuarios`
- `Rol` → `roles`
- `ProductoAlmacen` → `producto_almacen` (stock)
- `Cliente` → `clientes`
- `Proveedor` → `proveedores`

## Schemas (DTOs)

Los schemas Pydantic en `app/schemas/` incluyen campos calculados para compatibilidad con el frontend:

- `ProductResponse` incluye `slug`, `image`, `price`, `status` (calculados desde DB)
- Los campos que no existen en DB se generan automáticamente

## Tests

```bash
pytest tests/
```

## Calidad de Código

```bash
# Formatear
black app/
isort app/

# Linting
ruff check app/

# Type checking
mypy app/
```

## Próximos Pasos

1. **Completar endpoints admin restantes:**
   - Products CRUD
   - Variants CRUD
   - Inventory (ajustes de stock)
   - Customers
   - Suppliers
   - Sales/Orders
   - Purchases
   - Promotions
   - Reservations

2. **Migraciones Alembic:**
   - Crear migración inicial desde el SQL
   - Verificar que las migraciones reflejan el esquema 1:1

3. **Frontend:**
   - Generar tipos TypeScript desde OpenAPI
   - Actualizar servicios del frontend para usar API real
   - Auditar UI vs DB y crear reporte

4. **Panel Admin:**
   - Crear `apps/admin` con Next.js + Refine
   - Implementar CRUD completo con JWT + RBAC

5. **Tests:**
   - Tests de autenticación
   - Tests de catálogo
   - Tests de endpoints admin

## Notas

- El esquema SQL está en `inputs/db/ferreteria.sql`
- Los modelos SQLAlchemy respetan 1:1 los nombres y tipos del SQL
- Los schemas Pydantic incluyen campos calculados para compatibilidad con UI
- La autenticación usa JWT con access/refresh tokens
- RBAC se implementa con roles ADMIN, MANAGER, USER
