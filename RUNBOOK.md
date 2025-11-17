# RUNBOOK - Ferretería Urkupina

## 📋 Resumen

Este RUNBOOK explica cómo levantar el proyecto completo de Ferretería Urkupina en **Windows con PowerShell**.

### Servicios

- **Backend FastAPI**: `http://localhost:8000`
  - API REST bajo `/api/v1`
  - Documentación OpenAPI: `http://localhost:8000/docs`
  - Health check: `http://localhost:8000/api/v1/health`

- **Frontend Next.js**: `http://localhost:3000`
  - App Router
  - Consume API real en `http://localhost:8000/api/v1`

- **Base de Datos**: SQL Server en Windows (instancia local)
  - Base de datos: `ferreteria_urkupina`
  - Puerto: `1433`
  - Accesible desde host: `localhost,1433`
  - Accesible desde contenedor Docker: `host.docker.internal:1433`

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│                  http://localhost:3000                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Login/Reg   │  │  Catálogo    │  │    Admin     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
                             │ /api/v1/*
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (FastAPI + Docker)                     │
│              http://localhost:8000                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │  Products    │  │  Inventory   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │ pyodbc
                             │ ODBC Driver 18
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              SQL SERVER (Windows Host)                     │
│              localhost:1433                                  │
│                                                              │
│         Base: ferreteria_urkupina                            │
│         Schema: dbo                                          │
│         Usuario: ferre_app                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Prerequisitos

### Software Requerido

- ✅ **Docker Desktop** (Windows)
  - Verificar: `docker --version`
  - Verificar: `docker compose version`

- ✅ **Node.js 18+** y gestor de paquetes
  - Verificar: `node --version` (debe ser 18 o superior)
  - Verificar: `npm --version` o `pnpm --version`

- ✅ **SQL Server** en Windows (instancia local)
  - Puerto **1433** abierto
  - Autenticación mixta habilitada (Windows + SQL)
  - Firewall permitiendo conexiones TCP en puerto 1433

- ✅ **ODBC Driver 18 for SQL Server** (opcional, útil para `sqlcmd`)
  - Descarga: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

- ✅ **PowerShell** (Windows 10/11 viene con PowerShell 5.1+)

### Verificar Instalación

```powershell
# Verificar Docker
docker --version
docker compose version

# Verificar Node.js
node --version
npm --version

# Verificar SQL Server (debe estar corriendo)
sqlcmd -S localhost,1433 -Q "SELECT @@VERSION"
```

---

## 📝 Variables y Nombres Concretos

### Configuración de Base de Datos

El proyecto usa los siguientes valores por defecto:

| Variable | Valor | Ajustable |
|----------|-------|-----------|
| **Base de datos** | `ferreteria_urkupina` | ✅ Sí, cambiar en `.env` y scripts SQL |
| **Usuario SQL** | `ferre_app` | ✅ Sí, cambiar en `.env` y scripts SQL |
| **Contraseña SQL** | `F3rre!2025` | ✅ Sí, cambiar en `.env` y scripts SQL |
| **Instancia SQL** | `localhost,1433` | ⚠️ Solo si cambias puerto o instancia nombrada |
| **Schema** | `dbo` | ⚠️ No cambiar (hardcoded en modelos) |

### Cómo Cambiar Valores

Si necesitas usar otros valores:

1. **Base de datos diferente**:
   - Cambiar `ferreteria_urkupina` en `backend/docker-compose.yml` (línea 17)
   - Cambiar `ferreteria_urkupina` en `backend/.env` (variable `DATABASE_URL`)
   - Cambiar `USE ferreteria_urkupina;` en scripts SQL (Paso 1)

2. **Usuario/Contraseña diferente**:
   - Cambiar `ferre_app` y `F3rre!2025` en `backend/docker-compose.yml` (línea 17)
   - Cambiar en `backend/.env` (variable `DATABASE_URL`)
   - Cambiar en scripts SQL (Paso 1)

3. **Instancia nombrada o puerto diferente**:
   - Cambiar `localhost,1433` por `localhost\MSSQLSERVER,1433` o `localhost,1434`
   - Actualizar `DATABASE_URL` en `.env` y `docker-compose.yml`

---

## Paso 1 — Crear/Validar Usuario SQL en SSMS

### Objetivo

Crear el usuario SQL `ferre_app` con permisos de lectura/escritura en la base de datos `ferreteria_urkupina`.

### Script T-SQL (Ejecutar en SSMS)

Abre **SQL Server Management Studio (SSMS)** y ejecuta este script en dos partes:

#### 1. Crear Login (en `master`)

```sql
-- Conectar a master
USE master;
GO

-- Crear login si no existe
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = 'ferre_app')
BEGIN
    CREATE LOGIN ferre_app 
    WITH PASSWORD = 'F3rre!2025', 
         CHECK_POLICY = OFF,
         CHECK_EXPIRATION = OFF;
END
GO
```

#### 2. Crear Usuario y Permisos (en base de datos)

```sql
-- Conectar a la base de datos
USE ferreteria_urkupina;
GO

-- Crear usuario si no existe
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'ferre_app')
BEGIN
    CREATE USER ferre_app FOR LOGIN ferre_app;
    
    -- Permisos de lectura y escritura
    EXEC sp_addrolemember 'db_datareader', 'ferre_app';
    EXEC sp_addrolemember 'db_datawriter', 'ferre_app';
    
    -- Permisos para migraciones Alembic (DDL)
    -- Descomentar si vas a crear/modificar tablas desde la API:
    -- EXEC sp_addrolemember 'db_ddladmin', 'ferre_app';
END
GO
```

### ✅ Verificación con sqlcmd (PowerShell)

```powershell
# Verificar conexión y usuario
sqlcmd -S localhost,1433 -U ferre_app -P "F3rre!2025" -d ferreteria_urkupina -Q "SELECT TOP 1 name FROM sys.tables;"
```

**Respuesta esperada**: Lista de tablas (ej: `usuarios`, `productos`, etc.)

Si falla:
- ❗ Verificar que SQL Server está corriendo
- ❗ Verificar que el puerto 1433 está abierto
- ❗ Verificar que la autenticación mixta está habilitada
- ❗ Verificar que el usuario `ferre_app` existe y tiene permisos

---

## Paso 2 — Backend (FastAPI)

### Objetivo

Levantar el backend FastAPI en Docker con conexión a SQL Server del host Windows.

### 1. Ubicarse en `backend/`

```powershell
cd backend
```

### 2. Crear archivo `.env`

**⚠️ IMPORTANTE**: El archivo `.env` debe estar en `backend/.env` (no en `backend/app/.env`).

Crea o edita `backend/.env` con este contenido:

```env
# API Configuration
API_PREFIX=/api
APP_ENV=dev
CORS_ORIGINS=["http://localhost:3000"]

# Database Connection (SQL Server en Windows host)
DATABASE_URL=mssql+pyodbc://ferre_app:F3rre!2025@host.docker.internal:1433/ferreteria_urkupina?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes

# JWT Configuration
JWT_SECRET=change-me-in-production
JWT_ALG=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=43200
```

**Notas importantes:**
- `host.docker.internal` es el hostname especial de Docker para acceder al host Windows
- `Encrypt=yes&TrustServerCertificate=yes` son necesarios para ODBC Driver 18
- Si usas otra base de datos, cambia `ferreteria_urkupina` en `DATABASE_URL`

### 3. Construir y Arrancar Contenedor

```powershell
# Construir imagen (sin cache)
docker compose build --no-cache

# Levantar contenedor en background
docker compose up -d

# Verificar que está corriendo
docker compose ps
```

**Respuesta esperada**:
```
NAME                STATUS         PORTS
backend-api-1       Up 2 minutes   0.0.0.0:8000->8000/tcp
```

### 4. Crear Regla de Firewall (Windows)

**⚠️ IMPORTANTE**: Si `curl` falla con "connection refused" o "connection reset", necesitas crear una regla de firewall.

```powershell
# Ejecutar como Administrador (PowerShell)
# Opción 1: Usar script incluido
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\setup-firewall.ps1

# Opción 2: Comando manual
netsh advfirewall firewall add rule name="FastAPI-8000" dir=in action=allow protocol=TCP localport=8000
```

**Verificar que la regla existe**:
```powershell
Get-NetFirewallRule -Name "FastAPI-8000"
```

**Si necesitas eliminar la regla**:
```powershell
netsh advfirewall firewall delete rule name="FastAPI-8000"
```

### 5. Health Check

```powershell
# Usar curl.exe explícito (evita alias de PowerShell)
& "$Env:SystemRoot\System32\curl.exe" -v --http1.1 http://127.0.0.1:8000/api/v1/health
```

**Respuesta esperada**: `{"status":"ok"}`

Si retorna `{"status":"degraded"}`:
- ❗ Verificar conexión a DB: `docker compose exec api python scripts/db_ping.py`
- ❗ Verificar logs: `docker compose logs api --tail=50`

Si `curl` falla con "connection refused":
- ❗ Verificar que el contenedor está corriendo: `docker compose ps`
- ❗ Verificar que el puerto está mapeado: `docker port backend-api-1 8000/tcp`
- ❗ Verificar firewall: ejecutar `setup-firewall.ps1` como Administrador
- ❗ Verificar que SQL Server está corriendo en Windows

### 6. Sincronizar Alembic (si la BD ya existe)

Si tu base de datos **ya tiene tablas** (por ejemplo, desde `inputs/db/ferreteria.sql`), marca Alembic como sincronizado:

```powershell
# Marcar como sincronizado (no crea tablas)
docker compose exec api sh -c "PYTHONPATH=/app alembic stamp head"

# Verificar estado
docker compose exec api sh -c "PYTHONPATH=/app alembic current"
```

**Respuesta esperada**: Muestra el revision ID actual (ej: `001_add_idempotency_keys`)

### 7. Aplicar Migraciones (si hay nuevas)

Si hay migraciones nuevas (ej: `001_add_idempotency_keys`):

```powershell
# Aplicar migraciones
docker compose exec api sh -c "PYTHONPATH=/app alembic upgrade head"
```

### 8. Script de Autoverificación

```powershell
# Ejecutar script de selftest
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\selftest.ps1
```

**Salida esperada**: Todos los tests en verde (✅)

Este script verifica:
- ✅ Contenedores Docker corriendo
- ✅ Puerto 8000 publicado y accesible
- ✅ Health endpoint funcionando
- ✅ Docs endpoint funcionando
- ✅ OpenAPI JSON disponible
- ✅ Conexión a base de datos OK

### 9. Debug Útiles

```powershell
# Ver logs del contenedor
docker compose logs api --tail=200

# Verificar variable DATABASE_URL
docker compose exec api sh -c 'printf "%s\n" "$DATABASE_URL"'

# Test de conexión a DB
docker compose exec api python scripts/db_ping.py
```

**Respuesta esperada de `db_ping.py`**: `DB OK` o similar

### 8. Verificar Documentación API

Abre en tu navegador:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

---

## Paso 3 — Frontend (Next.js)

### Objetivo

Levantar el frontend Next.js que consume la API real del backend.

### 1. Ubicarse en `frontend/`

```powershell
cd ..\frontend
# o desde raíz del proyecto:
# cd frontend
```

### 2. Crear archivo `.env.local`

Crea `frontend/.env.local` con este contenido:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_API_PREFIX=/api/v1
```

**Nota**: Las variables `NEXT_PUBLIC_*` son expuestas al cliente y deben empezar con `NEXT_PUBLIC_`.

### 3. Instalar Dependencias

```powershell
# Con npm
npm install

# O con pnpm (más rápido)
pnpm install
```

### 4. Ejecutar Servidor de Desarrollo

```powershell
# Con npm
npm run dev

# O con pnpm
pnpm dev
```

**Respuesta esperada**:
```
   ▲ Next.js 16.0.0
   - Local:        http://localhost:3000
   - Ready in 2.3s
```

### 5. Abrir en Navegador

Abre `http://localhost:3000` en tu navegador.

**Verificaciones visuales:**
- ✅ Badge de salud API en header superior derecho (debe mostrar "API: ok" en verde)
- ✅ Página principal carga sin errores
- ✅ Catálogo muestra productos reales (si hay datos en DB)

---

## ✅ Verificación de Conexión Real Front ↔ Back

### 1. Abrir DevTools → Network

1. Abre `http://localhost:3000` en tu navegador
2. Presiona `F12` o clic derecho → "Inspeccionar"
3. Ve a la pestaña **Network** (Red)

### 2. Confirmar Requests a API Real

1. Navega a `/catalogo` o `/producto/[slug]`
2. En Network, filtra por "Fetch/XHR"
3. Verifica que las requests van a:
   - ✅ `http://localhost:8000/api/v1/products`
   - ✅ `http://localhost:8000/api/v1/products/{slug}`
   - ✅ Status: `200 OK` (no `404` o `500`)

**Si ves requests a `/api/*` locales (sin `localhost:8000`):**
- ❗ Verificar `frontend/.env.local` tiene `NEXT_PUBLIC_API_BASE=http://localhost:8000`
- ❗ Reiniciar servidor de desarrollo: `Ctrl+C` y `npm run dev` de nuevo

### 3. Verificar Persistencia Real

1. **Crear usuario desde UI**:
   - Ir a `http://localhost:3000/register`
   - Crear usuario con username, email, password
   - Verificar que se crea (redirige a `/admin` o muestra mensaje)

2. **Refrescar página**:
   - Presionar `F5` o `Ctrl+R`
   - Verificar que el usuario sigue existiendo (no desaparece)

3. **Verificar en DB** (opcional):
   ```sql
   -- En SSMS
   USE ferreteria_urkupina;
   SELECT TOP 10 * FROM dbo.usuarios ORDER BY id DESC;
   ```

**Si los datos desaparecen al refrescar:**
- ❗ Verificar que el backend está guardando en DB (no en memoria)
- ❗ Verificar logs del backend: `docker compose logs api --tail=50`
- ❗ Verificar que no hay errores de conexión a DB

---

## 🧪 Comandos de Prueba (Endpoints)

### Productos

```powershell
# Lista de productos (con paginación)
curl http://localhost:8000/api/v1/products?page=1&page_size=10

# Lista con filtro de búsqueda
curl "http://localhost:8000/api/v1/products?q=perno&page=1&page_size=5"

# Detalle por slug
curl http://localhost:8000/api/v1/products/perno-acero-inoxidable

# Variantes de un producto
curl http://localhost:8000/api/v1/products/perno-acero-inoxidable/variants
```

### Autenticación

```powershell
# Registrar usuario (con Idempotency-Key)
$idempotencyKey = New-Guid
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: $idempotencyKey" `
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"password123"}'

# Obtener usuario actual (requiere token)
curl http://localhost:8000/api/v1/auth/me `
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Inventario

> Nota: todas las operaciones de inventario requieren un usuario con rol **ADMIN**.  
> Obtén el token con `/api/v1/auth/login` y expórtalo como `ADMIN_TOKEN` para los ejemplos.

```powershell
# Listado consolidado (requiere token ADMIN)
$headers = @{
  "Accept" = "application/json"
  "Authorization" = "Bearer $Env:ADMIN_TOKEN"
}
curl http://localhost:8000/api/v1/inventory/stock `
  -H "Authorization: $($headers.Authorization)"

# Catálogo de almacenes
curl http://localhost:8000/api/v1/inventory/warehouses `
  -H "Authorization: $($headers.Authorization)"

# Buscar variante (al menos 2 caracteres en q)
curl "http://localhost:8000/api/v1/inventory/variants/search?q=per" `
  -H "Authorization: $($headers.Authorization)"

# Registrar ingreso manual de inventario
curl -X POST http://localhost:8000/api/v1/inventory/entries `
  -H "Content-Type: application/json" `
  -H "Authorization: $($headers.Authorization)" `
  -d '{
        "almacen_id": 1,
        "descripcion": "Ingreso manual",
        "items": [
          { "variante_id": 1, "cantidad": 2, "costo_unitario": 15.5 }
        ]
      }'

# Transferir stock entre almacenes
curl -X POST http://localhost:8000/api/v1/inventory/transfers `
  -H "Content-Type: application/json" `
  -H "Authorization: $($headers.Authorization)" `
  -d '{
        "almacen_origen_id": 1,
        "almacen_destino_id": 2,
        "descripcion": "Reubicación de stock",
        "items": [
          { "variante_id": 1, "cantidad": 1.5 }
        ]
      }'

# Ajustar stock a un valor exacto (ideal para revertir pruebas)
curl -X POST http://localhost:8000/api/v1/inventory/adjustments `
  -H "Content-Type: application/json" `
  -H "Authorization: $($headers.Authorization)" `
  -d '{
        "descripcion": "Reversión de prueba",
        "items": [
          { "variante_id": 1, "almacen_id": 1, "cantidad_nueva": 100 }
        ]
      }'
```

---

## 📦 Generar Tipos TypeScript desde OpenAPI

### Objetivo

Generar tipos TypeScript automáticamente desde la especificación OpenAPI del backend.

### Instalación (si no está instalado)

```powershell
cd frontend
npm install -D openapi-typescript
```

### Generar Tipos

```powershell
# Asegúrate de que el backend está corriendo
# Verificar: curl http://localhost:8000/openapi.json

# Generar tipos
npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts
```

**Salida esperada**: Se crea `frontend/types/api.d.ts` con todos los tipos.

### Usar Tipos en Servicios

Los tipos generados se usan en:
- `frontend/lib/services/products-service.ts`
- `frontend/lib/services/auth-service.ts`
- `frontend/lib/apiClient.ts`

**Ejemplo de uso**:
```typescript
import type { paths } from "@/types/api";

// Usar tipos generados
type ProductListResponse = paths["/api/v1/products"]["get"]["responses"]["200"]["content"]["application/json"];
```

### Script en package.json (Opcional)

Agregar a `frontend/package.json`:
```json
{
  "scripts": {
    "gen:api": "openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts"
  }
}
```

Luego ejecutar:
```powershell
npm run gen:api
```

---

## ❗ Problemas Frecuentes (FAQ)

### 1. "Login failed for user 'ferre_app'"

**Causa**: Usuario SQL no existe o contraseña incorrecta.

**Solución**:
1. Verificar que el usuario existe en SSMS:
   ```sql
   USE master;
   SELECT name FROM sys.sql_logins WHERE name = 'ferre_app';
   ```
2. Si no existe, ejecutar scripts SQL del **Paso 1**
3. Verificar contraseña: debe ser exactamente `F3rre!2025` (case-sensitive)
4. Verificar que el usuario tiene permisos en la base de datos:
   ```sql
   USE ferreteria_urkupina;
   SELECT dp.name, dp.type_desc FROM sys.database_principals dp
   WHERE dp.name = 'ferre_app';
   ```

### 2. CORS (401/403) o "No 'Access-Control-Allow-Origin' header"

**Causa**: CORS no configurado correctamente en backend.

**Solución**:
1. Verificar `backend/.env` tiene:
```env
CORS_ORIGINS=["http://localhost:3000"]
   ```
2. Reiniciar contenedor:
   ```powershell
   docker compose restart api
   ```
3. Verificar logs:
   ```powershell
   docker compose logs api --tail=50
   ```

### 3. No se ven requests a `/api/v1/*` en Network

**Causa**: Frontend no está configurado para usar la API real.

**Solución**:
1. Verificar `frontend/.env.local` existe y tiene:
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   NEXT_PUBLIC_API_PREFIX=/api/v1
   ```
2. Reiniciar servidor de desarrollo:
   ```powershell
   # Ctrl+C para detener
   npm run dev
   ```
3. Verificar que `frontend/lib/apiClient.ts` lee estas variables:
   ```typescript
   export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
   export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1";
   ```

### 4. Duplicados al crear usuario/producto

**Causa**: Doble submit sin Idempotency-Key.

**Solución**:
- ✅ El sistema ya implementa Idempotency-Key automáticamente en POST
- ✅ Verificar que `frontend/lib/apiClient.ts` genera UUID v4 para POST/PUT/PATCH
- ✅ Verificar que `frontend/hooks/use-form-submit.ts` tiene debounce de 300ms
- ✅ Verificar que los botones se deshabilitan con `isSubmitting`

**Archivos relevantes**:
- `frontend/lib/apiClient.ts` - Genera Idempotency-Key automáticamente
- `frontend/hooks/use-form-submit.ts` - Debounce y prevención de duplicados
- `backend/app/services/user_service.py` - Maneja Idempotency-Key

### 5. Contraste de UI (texto oscuro sobre fondo oscuro)

**Causa**: Clases Tailwind con contraste insuficiente.

**Solución**:
- ✅ Ya se corrigieron clases Tailwind en componentes admin
- ✅ Usar `text-slate-100` sobre `bg-slate-900`
- ✅ Usar `text-slate-300` para texto secundario
- ✅ Usar `text-white` sobre `bg-gray-800` o `bg-gray-900`

**Archivos corregidos**:
- `frontend/app/admin/products/page.tsx` - Tabla y formularios con contraste correcto
- `frontend/components/api-boundary.tsx` - Loading y error states

**Cómo detectar conflictos**:
- Usar DevTools → Lighthouse → Accessibility
- Verificar ratio de contraste WCAG AA (mínimo 4.5:1 para texto normal)

### 6. "Cannot find module '@/lib/apiClient'"

**Causa**: Path alias `@/` no configurado en TypeScript.

**Solución**:
1. Verificar `frontend/tsconfig.json` tiene:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```
2. Reiniciar servidor de desarrollo
3. Si persiste, verificar que el archivo existe: `frontend/lib/apiClient.ts`

### 7. Error "ODBC Driver 18 for SQL Server not found"

**Causa**: Driver ODBC no disponible en el contenedor Docker.

**Solución**:
- ✅ El Dockerfile del backend ya incluye ODBC Driver 18
- ✅ Verificar que `backend/Dockerfile` instala el driver
- ✅ Reconstruir imagen: `docker compose build --no-cache`

### 8. "alembic: command not found"

**Causa**: Alembic no está en PATH dentro del contenedor.

**Solución**:
- ✅ Usar `sh -c` con `PYTHONPATH=/app`:
  ```powershell
  docker compose exec api sh -c "PYTHONPATH=/app alembic current"
  ```

---

## 📚 Apéndice

### Comandos para Reiniciar

#### Backend

```powershell
cd backend

# Reiniciar contenedor
docker compose restart api

# Reconstruir y reiniciar
docker compose down
docker compose build --no-cache
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f api
```

#### Frontend

```powershell
cd frontend

# Detener servidor
# Ctrl+C en la terminal donde corre npm run dev

# Reiniciar
npm run dev
# o
pnpm dev
```

### Comandos Útiles

#### Verificar Estado de Contenedores

```powershell
cd backend
docker compose ps
docker compose logs api --tail=50
```

#### Verificar Conexión a DB

```powershell
cd backend
docker compose exec api python scripts/db_ping.py
```

#### Verificar Variables de Entorno

```powershell
cd backend
docker compose exec api sh -c 'echo $DATABASE_URL'
docker compose exec api sh -c 'echo $CORS_ORIGINS'
```

#### Verificar Health Endpoint

```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:8000/api/v1/health | ConvertFrom-Json

# O con curl
curl http://localhost:8000/api/v1/health
```

### Documentación Adicional

- **CHANGELOG.md**: Lista de cambios realizados en el proyecto
  - `backend/CHANGELOG.md` - Cambios del backend
  - `frontend/CHANGELOG.md` - Cambios del frontend
  - `REPARACION_COMPLETA.md` - Resumen de reparación completa

- **AUDIT_UI_DB.md**: Auditoría de discrepancias entre UI y base de datos
  - Mapeo de campos UI ↔ DB
  - Campos calculados (DTOs)
  - Decisiones de diseño

- **README.md**: Documentación general del proyecto
  - `backend/README.md` - Guía del backend
  - `frontend/README.md` - Guía del frontend (si existe)

### Mantener Documentación Actualizada

**Cuando hagas cambios importantes:**
1. Actualizar `CHANGELOG.md` con fecha y descripción
2. Actualizar `AUDIT_UI_DB.md` si cambian campos UI/DB
3. Actualizar este `RUNBOOK.md` si cambian comandos o configuración

---

## ✅ Checklist de Arranque Completo

Marca cada paso cuando lo completes:

- [ ] **Paso 1**: Usuario SQL `ferre_app` creado y verificado
- [ ] **Paso 2**: Backend corriendo en `http://localhost:8000`
- [ ] **Paso 2**: Health endpoint retorna `{"status":"ok"}`
- [ ] **Paso 2**: Alembic sincronizado (si BD ya existe)
- [ ] **Paso 3**: Frontend corriendo en `http://localhost:3000`
- [ ] **Verificación**: Badge de salud muestra "API: ok"
- [ ] **Verificación**: Network muestra requests a `http://localhost:8000/api/v1/*`
- [ ] **Verificación**: Datos persisten al refrescar página
- [ ] **Opcional**: Tipos TypeScript generados desde OpenAPI

---

## 🎯 Estado Final Esperado

Después de completar todos los pasos:

✅ **Backend**: API corriendo en `http://localhost:8000` con conexión a SQL Server real
✅ **Frontend**: App corriendo en `http://localhost:3000` consumiendo API real
✅ **Base de Datos**: Usuario `ferre_app` con permisos correctos
✅ **Sin Mocks**: Todo el frontend consume datos reales de la API
✅ **Persistencia**: Datos se guardan en MSSQL y persisten al refrescar
✅ **Anti-Duplicados**: Idempotency-Key implementado en POST críticos
✅ **Health Check**: Badge de salud muestra estado real de la API

---

**Última actualización**: 2025-01-XX
**Versión**: 1.0.0

