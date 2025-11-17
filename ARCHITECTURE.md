# Arquitectura Técnica – Ferretería Urkupina

## Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                    │
│                 http://localhost:3000 (App Router)          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Catálogo     │  │ Detalle      │  │ Panel Administrativo│
│  │ público      │  │ producto     │  │ (usuarios, compras…) │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ Fetch API (JSON)
                             │ NEXT_PUBLIC_API_BASE + PREFIX
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               Backend (FastAPI + SQLAlchemy 2)              │
│                 http://localhost:8000/api/v1                 │
│                                                             │
│  ┌──────────┐ ┌────────────┐ ┌──────────────┐ ┌────────────┐│
│  │ Core     │ │ API V1     │ │ Services     │ │ Repositorios││
│  │ config   │ │ Routers    │ │ (dominio)    │ │ (SQLAlchemy)││
│  └──────────┘ └────────────┘ └──────────────┘ └────────────┘│
└────────────────────────────┬────────────────────────────────┘
                             │ pyodbc (ODBC Driver 18)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  SQL Server (host Windows)                   │
│               Base: ferreteria_urkupina (dbo)               │
└─────────────────────────────────────────────────────────────┘
```

## Backend

### Capas Principales

| Capa                     | Directorio                         | Responsabilidad                                                      |
|-------------------------|------------------------------------|-----------------------------------------------------------------------|
| **Configuración**       | `app/core/config.py`               | Cargar `.env` con Pydantic Settings (API_PREFIX, DATABASE_URL, JWT…) |
| **Sesión DB**           | `app/db/session.py`                | Crear Engine + Session (SQLAlchemy 2, pyodbc, pool_pre_ping)          |
| **Modelos ORM**         | `app/models/*.py`                  | Mapear tablas reales de `ferreteria_urkupina` (schema `dbo`)          |
| **Schemas (DTOs)**      | `app/schemas/*.py`                 | Modelos Pydantic para request/response                                |
| **Repositorios**        | `app/repositories/*.py`            | Consultas SQLAlchemy + filtros/paginación                             |
| **Servicios**           | `app/services/*.py`                | Reglas de negocio (idempotencia, mapeos, validaciones)                |
| **Routers API v1**      | `app/api/v1/*.py`                  | Endpoints FastAPI (auth, users, products, inventory, etc.)            |
| **Core Security**       | `app/core/security.py`             | Hash bcrypt, JWT access/refresh                                       |
| **Dependencias**        | `app/core/dependencies.py`         | `get_current_user`, RBAC con `require_role("ADMIN")`                  |

### Principales Endpoints

- `POST /api/v1/auth/login` – Login con email + password (JWT)
- `POST /api/v1/auth/register` – Registro con Idempotency-Key
- `GET /api/v1/products` – Catálogo paginado + filtros
- `GET /api/v1/inventory/stock/{variant_id}` – Stock por variante/almacén
- `POST /api/v1/inventory/entries` – Registro de ingresos manuales (ADMIN)
- `POST /api/v1/inventory/transfers` – Transferencias entre almacenes (ADMIN)
- `POST /api/v1/inventory/adjustments` – Ajustes de inventario físicos (ADMIN)
- `GET /api/v1/inventory/warehouses` – Catálogo de almacenes (ADMIN)
- `GET /api/v1/inventory/variants/search` – Buscador de variantes con stock (ADMIN)
- `GET /api/v1/users` – Gestión de usuarios (ADMIN)
- `GET /api/v1/suppliers`, `/customers`, `/purchases`, `/sales`, `/reservations`, `/promotions`, `/files`
  - Módulos admin en modo lectura seguro (sin mocks)

### Idempotencia

- Tabla real `dbo.idempotency_keys`
- Repositorio `idempotency_repo.py`
- Servicios que la usan: registro de usuarios, futuros POST críticos
- `apiClient.ts` genera `Idempotency-Key` automáticamente para POST/PUT/PATCH

### Configuración (.env)

```env
API_PREFIX=/api
APP_ENV=dev
CORS_ORIGINS=["http://localhost:3000"]
DATABASE_URL=mssql+pyodbc://USER:PASS@host.docker.internal:1433/ferreteria_urkupina?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes
JWT_SECRET=change-me
JWT_ALG=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=43200
```

### Dependencias Importantes

- **FastAPI**
- **SQLAlchemy 2.x** (ORM tipado, relaciones reales)
- **pyodbc + ODBC Driver 18**
- **bcrypt / passlib**
- **python-jose** (JWT)
- **pydantic-settings**

## Frontend

### Configuración (.env.local)

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_API_PREFIX=/api/v1
```

El cliente HTTP central (`lib/apiClient.ts`):

- Concatena base + prefix (`API_URL`)
- Inyecta `Authorization` cuando existe token
- Genera `Idempotency-Key` UUID v4 en mutaciones
- Maneja refresh token + redirección a `/login`

### Servicios React (consumen API real)

| Servicio                           | Endpoints consumidos                                            |
|------------------------------------|-----------------------------------------------------------------|
| `auth-service.ts`                  | `/auth/login`, `/auth/register`, `/auth/me`                     |
| `products-service.ts`              | `/products`, `/products/{slug}`, `/inventory/stock/{id}`        |
| `inventory-service.ts`             | `/inventory/stock`, `/inventory/warehouses`, `/inventory/variants/search`,<br>`/inventory/entries`, `/inventory/transfers`, `/inventory/adjustments` |
| `users-service.ts`                 | `/users`, `/users/{id}`, `/users/roles/all`                     |
| `suppliers-service.ts`             | `/suppliers` (CRUD parcial)                                     |
| `customers-service.ts`             | `/customers` (CRUD parcial)                                     |
| `purchases-service.ts`             | `/purchases` (modo lectura)                                     |
| `sales-service.ts`                 | `/sales` (modo lectura)                                         |
| `promotions-service.ts`            | `/promotions` (modo lectura)                                    |
| `reservations-service.ts`          | `/reservations` (modo lectura)                                  |
| `files-service.ts`                 | `/files` (modo lectura de assets asociados a productos)         |

> Nota: módulos admin que todavía no exponen escritura devolverán mensajes
> amigables (`Funcionalidad no disponible todavía`) y funcionan en modo lectura
> contra la base real.

### UI / App Router

- App Router (`app/`) con páginas públicas y admin
- Componentes reutilizables en `components/` (UI + layouts)
- Hooks globales (`hooks/use-toast`, `hooks/use-form-submit`)
- Tailwind + clases con contraste corregido (accesibilidad AA)
- Badge “API Health” en header consulta `/api/v1/health`

## Base de Datos

- Servidor: SQL Server (instalado en Windows host)
- Base: `ferreteria_urkupina`
- Schema: `dbo`
- Tablas reflejadas en ORM: usuarios, roles, permisos, productos, variantes, imágenes, almacenes, stock, proveedores, clientes, ordenes_compra, ordenes_venta, reservas, promociones, reglas_promocion, etc.
- Tabla auxiliar: `dbo.idempotency_keys`

## Flujo de Datos (ejemplo)

1. Usuario abre `/catalogo` → Next.js `productsService.listProducts()`
2. `apiClient` llama `GET http://localhost:8000/api/v1/products`
3. FastAPI (products router) delega a `ProductService` → `ProductRepository`
4. Repositorio ejecuta SQLAlchemy con joins (marcas, categorías, variantes, imágenes)
5. Respuesta JSON → mapeada a `ProductListResponse` → UI renderiza tarjetas

## Scripts Útiles

- `backend/scripts/db_ping.py` – Valida conexión MSSQL desde contenedor
- `backend/scripts/selftest.ps1` – Health end-to-end (Docker + API)
- `npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts` – Generar tipos TS

## Pruebas

- `pytest backend/tests` cubre health, autenticación, productos y los flujos críticos de inventario.
- Tests destacados:
  - `test_inventory.py`: verifica stock consolidado, metadatos y ciclos de ingreso/ajuste.
  - `test_products_list_detail.py`: catálogo público y detalle.
  - `test_auth_flow.py`: registro, login y refresh token.

## Pendientes / Roadmap

- Exponer escritura completa para compras, ventas, reservas, promociones
- Endpoint de subida/borrado de archivos (actualmente solo lectura)
- Automatizar generación de tipos TS (`npm run gen:api`)
- Añadir tests e2e (Playwright) para flujos admin

---

**Última actualización:** 2025-01-XX  
**Responsable:** Equipo Tech Lead / Arquitectura Full-Stack

