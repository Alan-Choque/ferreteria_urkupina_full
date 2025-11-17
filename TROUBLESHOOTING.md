# TROUBLESHOOTING - Ferretería Urkupina

## ❗ Problemas Comunes y Soluciones

Este documento lista los errores típicos y sus soluciones paso a paso.

---

## 🔥 Backend / Docker

### 1. `curl: (56) Recv failure` o `curl: (7) connection refused`

**Síntomas**:
- Desde Windows: `curl http://localhost:8000/api/v1/health` falla
- Desde contenedor: `curl http://127.0.0.1:8000/api/v1/health` funciona ✅

**Causas posibles**:
1. ❌ Puerto 8000 bloqueado por firewall de Windows
2. ❌ Contenedor no está corriendo
3. ❌ Puerto no está mapeado correctamente
4. ❌ Alias de `curl` en PowerShell (no usa `curl.exe` real)

**Soluciones**:

#### Paso 1: Verificar que el contenedor está corriendo

```powershell
cd backend
docker compose ps
```

**Si no está corriendo**:
```powershell
docker compose up -d
docker compose logs api --tail=50
```

#### Paso 2: Verificar que el puerto está mapeado

```powershell
docker port backend-api-1 8000/tcp
```

**Respuesta esperada**: `0.0.0.0:8000->8000/tcp`

**Si no está mapeado**:
- Verificar `docker-compose.yml` tiene `ports: - "8000:8000"`
- Reconstruir: `docker compose down && docker compose up -d --build`

#### Paso 3: Crear regla de firewall

```powershell
# Ejecutar como Administrador
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\setup-firewall.ps1

# O manualmente:
netsh advfirewall firewall add rule name="FastAPI-8000" dir=in action=allow protocol=TCP localport=8000
```

**Verificar que la regla existe**:
```powershell
Get-NetFirewallRule -Name "FastAPI-8000"
```

#### Paso 4: Usar curl.exe explícito (evitar alias de PowerShell)

```powershell
# ❌ Mal (puede usar alias de PowerShell)
curl http://localhost:8000/api/v1/health

# ✅ Bien (usa curl.exe real)
& "$Env:SystemRoot\System32\curl.exe" -v --http1.1 http://127.0.0.1:8000/api/v1/health
```

#### Paso 5: Verificar conexión TCP

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 8000
```

**Si falla**:
- ❗ Verificar que el contenedor está corriendo
- ❗ Verificar que el firewall permite el puerto 8000
- ❗ Verificar que no hay otro proceso usando el puerto 8000

#### Paso 6: Verificar logs del contenedor

```powershell
docker compose logs api --tail=50
```

**Buscar errores**:
- `Error: [Errno 111] Connection refused` → Puerto no mapeado
- `Error: cannot connect to database` → Ver problema #2
- `Error: No module named 'app'` → PYTHONPATH incorrecto

---

### 2. `Login failed for user 'ferre_app'`

**Síntomas**:
- Error en logs: `Login failed for user 'ferre_app'`
- `db_ping.py` falla con error de autenticación
- Health endpoint retorna `{"status":"degraded"}`

**Causas posibles**:
1. ❌ Usuario SQL `ferre_app` no existe
2. ❌ Contraseña incorrecta
3. ❌ Usuario no tiene permisos en la base de datos
4. ❌ SQL Server no acepta autenticación SQL (solo Windows)

**Soluciones**:

#### Paso 1: Verificar que el usuario existe

```sql
-- En SSMS, ejecutar en master:
USE master;
SELECT name, type_desc FROM sys.sql_logins WHERE name = 'ferre_app';
```

**Si no existe**, ejecutar script T-SQL:

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

#### Paso 2: Verificar que el usuario tiene permisos en la BD

```sql
-- En SSMS, ejecutar en ferreteria_urkupina:
USE ferreteria_urkupina;
GO

SELECT dp.name, dp.type_desc, dp.default_schema_name
FROM sys.database_principals dp
WHERE dp.name = 'ferre_app';
```

**Si no existe**, ejecutar script T-SQL:

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
    
    -- Permisos para migraciones Alembic (DDL) - opcional
    -- EXEC sp_addrolemember 'db_ddladmin', 'ferre_app';
END
GO
```

#### Paso 3: Verificar contraseña

```powershell
# Probar conexión con sqlcmd
sqlcmd -S localhost,1433 -U ferre_app -P "F3rre!2025" -d ferreteria_urkupina -Q "SELECT TOP 1 name FROM sys.tables;"
```

**Si falla**:
- ❗ Verificar que la contraseña es exactamente `F3rre!2025` (case-sensitive)
- ❗ Verificar que `CHECK_POLICY = OFF` en el login (si no, la contraseña debe cumplir política de Windows)

#### Paso 4: Verificar autenticación SQL habilitada

```sql
-- En SSMS, ejecutar:
EXEC xp_instance_regread 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer', 
    N'LoginMode';
```

**Si retorna `1`** (solo Windows):
- ❗ Habilitar autenticación mixta en SQL Server Configuration Manager
- ❗ Reiniciar SQL Server

**Si retorna `2`** (mixta): ✅ Correcto

#### Paso 5: Verificar DATABASE_URL en .env

```powershell
# Verificar que DATABASE_URL tiene la contraseña correcta
cd backend
cat .env | Select-String "DATABASE_URL"
```

**Debe ser**:
```
DATABASE_URL=mssql+pyodbc://ferre_app:F3rre!2025@host.docker.internal:1433/ferreteria_urkupina?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes
```

**Si la contraseña es diferente**, actualizar:
1. Actualizar `.env` con la contraseña correcta
2. Reiniciar contenedor: `docker compose restart api`

---

### 3. `alembic.ini BOM` o `falta sección [alembic]`

**Síntomas**:
- Error al ejecutar `alembic`: `ConfigParser.NoSectionError: No section: 'alembic'`
- Error de encoding: `'utf-8' codec can't decode byte 0xef in position 0`

**Causas posibles**:
1. ❌ Archivo `alembic.ini` tiene BOM (Byte Order Mark) al inicio
2. ❌ Falta sección `[alembic]` en `alembic.ini`
3. ❌ Archivo tiene encoding incorrecto

**Soluciones**:

#### Paso 1: Verificar que existe sección [alembic]

```powershell
cd backend
cat alembic.ini | Select-String "\[alembic\]"
```

**Debe mostrar**: `[alembic]`

**Si no existe**, verificar contenido de `alembic.ini`:
```ini
[alembic]
script_location = alembic
prepend_sys_path = .

# (dejamos la URL en env.py con pydantic-settings)
sqlalchemy.url =
```

#### Paso 2: Eliminar BOM (si existe)

```powershell
# Leer archivo sin BOM
$content = Get-Content backend\alembic.ini -Raw -Encoding UTF8

# Eliminar BOM si existe
$content = $content -replace "^\xEF\xBB\xBF", ""

# Guardar sin BOM
[System.IO.File]::WriteAllText("$PWD\backend\alembic.ini", $content, [System.Text.UTF8Encoding]::new($false))
```

**O usar Notepad++**:
1. Abrir `alembic.ini` en Notepad++
2. Encoding → Convert to UTF-8 (sin BOM)
3. Guardar

#### Paso 3: Verificar que env.py lee DATABASE_URL correctamente

```python
# backend/alembic/env.py debe tener:
from app.core.config import settings

if not config.get_main_option("sqlalchemy.url"):
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

**Si falta**, actualizar `alembic/env.py` con el código arriba.

---

### 4. Duplicados al crear usuarios/productos

**Síntomas**:
- Doble click en submit crea 2 usuarios/productos
- Error 409 Conflict al crear usuario existente
- Race condition en requests concurrentes

**Causas posibles**:
1. ❌ Frontend no usa Idempotency-Key
2. ❌ Backend no valida Idempotency-Key
3. ❌ No hay debounce en formularios
4. ❌ No hay validación de unique constraint en DB

**Soluciones**:

#### ✅ Sistema ya implementado

El sistema **ya implementa** Idempotency-Key automáticamente:

**Frontend**:
- `frontend/lib/apiClient.ts` genera UUID v4 automáticamente en POST/PUT/PATCH
- `frontend/hooks/use-form-submit.ts` tiene debounce de 300ms

**Backend**:
- `backend/app/services/user_service.py` maneja Idempotency-Key
- `backend/app/repositories/idempotency_repo.py` almacena respuestas
- `backend/app/models/idempotency.py` define tabla `dbo.idempotency_keys`

#### Verificar que funciona

```powershell
# Test 1: Crear usuario con Idempotency-Key
$idempotencyKey = New-Guid
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: $idempotencyKey" `
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test 2: Repetir con misma key (debe retornar misma respuesta sin duplicar)
curl -X POST http://localhost:8000/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: $idempotencyKey" `
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

**Respuesta esperada**:
- Primera request: `201 Created` con usuario
- Segunda request: `201 Created` con **mismo usuario** (sin duplicar)

#### Si aún hay duplicados

1. **Verificar que Idempotency-Key se envía**:
   - Abrir DevTools → Network
   - Verificar que POST requests tienen header `Idempotency-Key`

2. **Verificar que la tabla idempotency_keys existe**:
   ```sql
   USE ferreteria_urkupina;
   SELECT TOP 10 * FROM dbo.idempotency_keys ORDER BY created_at DESC;
   ```

3. **Aplicar migración si falta**:
   ```powershell
   docker compose exec api sh -c "PYTHONPATH=/app alembic upgrade head"
   ```

---

### 5. CORS 401/403 o "No 'Access-Control-Allow-Origin' header"

**Síntomas**:
- Error en consola: `Access to fetch at 'http://localhost:8000/api/v1/...' from origin 'http://localhost:3000' has been blocked by CORS policy`
- Status 401/403 en requests OPTIONS
- Requests no llegan al backend

**Causas posibles**:
1. ❌ CORS no configurado en backend
2. ❌ `CORS_ORIGINS` no incluye `http://localhost:3000`
3. ❌ Contenedor no reiniciado después de cambiar `.env`

**Soluciones**:

#### Paso 1: Verificar CORS_ORIGINS en .env

```powershell
cd backend
cat .env | Select-String "CORS_ORIGINS"
```

**Debe ser**:
```
CORS_ORIGINS=["http://localhost:3000"]
```

**O coma-separado**:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Paso 2: Reiniciar contenedor

```powershell
docker compose restart api
docker compose logs api --tail=20
```

**Buscar**:
```
INFO:     Application startup complete.
```

#### Paso 3: Verificar que CORS está configurado en main.py

```python
# backend/app/main.py debe tener:
from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ✅ Debe leer desde settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Paso 4: Verificar que settings.CORS_ORIGINS funciona

```powershell
# Test manual
curl -X OPTIONS http://localhost:8000/api/v1/products `
  -H "Origin: http://localhost:3000" `
  -H "Access-Control-Request-Method: GET" `
  -v
```

**Respuesta esperada**:
```
< Access-Control-Allow-Origin: http://localhost:3000
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

### 6. Frontend no consume API real (usa mocks)

**Síntomas**:
- En Network DevTools: no hay requests a `http://localhost:8000/api/v1/*`
- Requests van a `/api/*` locales (sin `localhost:8000`)
- Datos no persisten al refrescar página

**Causas posibles**:
1. ❌ `frontend/.env.local` no existe o tiene valores incorrectos
2. ❌ `frontend/lib/apiClient.ts` no lee `NEXT_PUBLIC_API_BASE`
3. ❌ Servicios aún usan mocks en lugar de `apiClient`

**Soluciones**:

#### Paso 1: Verificar .env.local

```powershell
cd frontend
cat .env.local
```

**Debe tener**:
```
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_API_PREFIX=/api/v1
```

**Si no existe**, crear:
```powershell
cd frontend
@"
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_API_PREFIX=/api/v1
"@ | Out-File -FilePath .env.local -Encoding utf8
```

#### Paso 2: Reiniciar servidor de desarrollo

```powershell
# Ctrl+C para detener
npm run dev
# o
pnpm dev
```

**⚠️ IMPORTANTE**: Next.js solo lee `.env.local` al iniciar. Si cambias `.env.local`, debes reiniciar.

#### Paso 3: Verificar que apiClient.ts lee las variables

```typescript
// frontend/lib/apiClient.ts debe tener:
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1";
export const API_URL = `${API_BASE}${API_PREFIX}`;
```

#### Paso 4: Verificar que servicios usan apiClient

```typescript
// frontend/lib/services/products-service.ts debe tener:
import { api } from "@/lib/apiClient";

export const productsService = {
  async listProducts() {
    return api.get<ProductListResponse>("/products");
  },
  // ✅ NO debe tener mocks o datos hardcodeados
};
```

**Servicios que usan API real**:
- ✅ `auth-service.ts` – Tokens y sesiones reales
- ✅ `products-service.ts` – Catálogo, variantes e inventario
- ✅ `customers-service.ts` – Clientes reales desde SQL Server
- ✅ `suppliers-service.ts` – Proveedores reales
- ✅ `sales-service.ts` – Órdenes de venta en modo lectura
- ✅ `purchases-service.ts` – Órdenes de compra en modo lectura
- ✅ `reservations-service.ts` – Reservas en modo lectura
- ✅ `files-service.ts` – Activos/imágenes de productos en modo lectura

---

### 7. Contraste de UI (texto oscuro sobre fondo oscuro)

**Síntomas**:
- Texto no se ve en widgets oscuros (admin panel)
- Contraste insuficiente (WCAG AA falla)
- Usuario no puede leer información

**Soluciones**:

#### ✅ Ya corregido en componentes principales

**Componentes corregidos**:
- `frontend/app/admin/products/page.tsx` - Tabla y formularios con contraste correcto
- `frontend/components/api-boundary.tsx` - Loading y error states

**Tokens Tailwind corregidos**:
- ❌ `text-slate-900` sobre `bg-slate-900` → ✅ `text-slate-100`
- ❌ `text-gray-900` sobre `bg-gray-800` → ✅ `text-white`
- ❌ `text-neutral-900` sobre `bg-neutral-900` → ✅ `text-neutral-100`

#### Cómo detectar conflictos

1. **Usar DevTools → Lighthouse → Accessibility**:
   - Abrir página en Chrome
   - F12 → Lighthouse → Accessibility
   - Verificar ratio de contraste (mínimo 4.5:1 para texto normal)

2. **Usar DevTools → Accessibility Tree**:
   - F12 → Elements → Accessibility
   - Verificar que todos los elementos tienen contraste adecuado

3. **Usar herramientas de contraste**:
   - https://webaim.org/resources/contrastchecker/
   - Ingresar color de fondo y color de texto
   - Verificar que ratio ≥ 4.5:1

#### Cómo corregir

**Regla general**:
- Fondo oscuro (`bg-slate-900`, `bg-gray-800`) → Texto claro (`text-slate-100`, `text-white`)
- Fondo claro (`bg-white`, `bg-slate-50`) → Texto oscuro (`text-slate-900`, `text-gray-900`)

**Ejemplos**:
```tsx
// ❌ Mal
<div className="bg-slate-900 text-slate-900">Texto invisible</div>

// ✅ Bien
<div className="bg-slate-900 text-slate-100">Texto visible</div>
```

---

### 8. `alembic: command not found` o `alembic: No such file or directory`

**Síntomas**:
- Error al ejecutar `alembic`: `command not found`
- Error: `alembic: No such file or directory`

**Soluciones**:

#### Usar PYTHONPATH explícito

```powershell
# ❌ Mal (puede fallar)
docker compose exec api alembic current

# ✅ Bien (usa PYTHONPATH explícito)
docker compose exec api sh -c "PYTHONPATH=/app alembic current"
```

#### Verificar que alembic está instalado

```powershell
docker compose exec api sh -c "PYTHONPATH=/app python -m alembic --version"
```

**Si falla**: Reconstruir imagen:
```powershell
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

### 9. "Cannot find module '@/lib/apiClient'" o errores de path alias

**Síntomas**:
- Error de TypeScript: `Cannot find module '@/lib/apiClient'`
- Error de build: `Module not found: Can't resolve '@/lib/apiClient'`

**Soluciones**:

#### Paso 1: Verificar tsconfig.json

```json
// frontend/tsconfig.json debe tener:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### Paso 2: Reiniciar servidor de desarrollo

```powershell
# Ctrl+C para detener
npm run dev
```

#### Paso 3: Limpiar cache de Next.js

```powershell
cd frontend
rm -r .next
npm run dev
```

---

### 10. `400 - Stock insuficiente` al registrar ingresos o transferencias

**Síntomas**:
- Respuesta de la API: `{"detail":"Stock insuficiente para la variante ..."}`
- Operación en el panel de inventario se revierte automáticamente.

**Posibles causas**:
1. Intentas transferir más unidades de las disponibles en el almacén origen.
2. El `almacen_id` o `variante_id` enviados no existen en la base real.
3. `cantidad` o `cantidad_nueva` son `0`, negativas o no numéricas.

**Soluciones**:

1. Verificar el stock actual antes de operar:
   ```powershell
   curl http://localhost:8000/api/v1/inventory/stock `
     -H "Authorization: Bearer $Env:ADMIN_TOKEN"
   ```
2. Ajustar las cantidades para que no excedan el inventario disponible.
3. Usar el buscador de variantes del panel (botón **Buscar**) para evitar IDs no válidos.
4. En pruebas, revertir rápidamente con el endpoint de ajustes:
   ```powershell
   curl -X POST http://localhost:8000/api/v1/inventory/adjustments `
     -H "Content-Type: application/json" `
     -H "Authorization: Bearer $Env:ADMIN_TOKEN" `
     -d '{"descripcion":"Reversión de prueba","items":[{"variante_id":1,"almacen_id":1,"cantidad_nueva":100}]}'
   ```

---

### 11. "ODBC Driver 18 for SQL Server not found"

**Síntomas**:
- Error: `[Microsoft][ODBC Driver Manager] Driver's SQLAllocHandle on SQL_HANDLE_ENV failed`
- Error: `ODBC Driver 18 for SQL Server not found`

**Soluciones**:

#### ✅ Ya está instalado en Dockerfile

El `backend/Dockerfile` ya instala ODBC Driver 18:

```dockerfile
RUN ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18
```

#### Verificar instalación en contenedor

```powershell
docker compose exec api sh -c "odbcinst -q -d"
```

**Debe mostrar**: `ODBC Driver 18 for SQL Server`

#### Si no está instalado, reconstruir imagen

```powershell
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 🔍 Debug Rápido

### Comandos Útiles

```powershell
# Verificar estado de contenedores
docker compose ps

# Ver logs del backend
docker compose logs api --tail=50

# Verificar puerto mapeado
docker port backend-api-1 8000/tcp

# Test de conexión TCP
Test-NetConnection -ComputerName 127.0.0.1 -Port 8000

# Test de health endpoint
& "$Env:SystemRoot\System32\curl.exe" -v --http1.1 http://127.0.0.1:8000/api/v1/health

# Test de conexión a DB
docker compose exec api python scripts/db_ping.py

# Ejecutar selftest completo
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\selftest.ps1
```

### Verificar Variables de Entorno

```powershell
# Backend
docker compose exec api sh -c 'echo $DATABASE_URL'
docker compose exec api sh -c 'echo $CORS_ORIGINS'

# Frontend
cd frontend
cat .env.local
```

---

## 📚 Referencias

- **RUNBOOK.md**: Guía paso a paso para levantar el proyecto
- **CHANGELOG.md**: Lista de cambios realizados
- **AUDIT_UI_DB.md**: Auditoría de discrepancias UI vs DB

---

**Última actualización**: 2025-01-XX
**Versión**: 1.0.0

