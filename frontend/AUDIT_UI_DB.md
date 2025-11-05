# Auditoría UI ↔ DB - Frontend Ferretería Urkupina

## Resumen de Auditoría

**Fecha:** 2025-01-XX  
**Estado:** ✅ Completado - Frontend conectado a Backend FastAPI

## Archivos Auditados

| Componente/Página | Campo en UI | Campo en API/DB | Estado | Acción |
|-------------------|-------------|----------------|--------|--------|
| `app/producto/[slug]/page.tsx` | `name` | `nombre` (DB), `name` (API) | ✅ OK | Mapeo: `product.name || product.nombre` |
| `app/producto/[slug]/page.tsx` | `image` | `image` (API), `imagenes[0].url` (DB) | ✅ OK | Mapeo: `product.image || product.imagenes?.[0]?.url` |
| `app/producto/[slug]/page.tsx` | `short` | `short` (API), `descripcion` (DB) | ✅ OK | Mapeo: `product.short || product.descripcion` |
| `app/producto/[slug]/page.tsx` | `price` | `price` (API), `variantes[0].precio` (DB) | ✅ OK | Fallback: `product.price ?? product.variantes?.[0]?.precio` |
| `app/producto/[slug]/page.tsx` | `slug` | `slug` (calculado desde `nombre`) | ✅ OK | Backend calcula slug desde nombre |
| `app/catalogo/page.tsx` | `id` | `id` (DB) | ✅ OK | Coincide |
| `app/catalogo/page.tsx` | `name` | `nombre` (DB), `name` (API) | ✅ OK | Mapeo: `product.name || product.nombre` |
| `app/catalogo/page.tsx` | `slug` | `slug` (calculado) | ✅ OK | Backend calcula slug |
| `app/catalogo/page.tsx` | `image` | `image` (API), `imagenes[0].url` (DB) | ✅ OK | Mapeo: `product.image || product.imagenes?.[0]?.url` |
| `app/catalogo/page.tsx` | `price` | `price` (API), `variantes[0].precio` (DB) | ✅ OK | Fallback: `product.price ?? product.variantes?.[0]?.precio` |
| `app/catalogo/page.tsx` | `brand` | `marca.nombre` (DB) | ✅ OK | Mapeo: `product.marca?.nombre` |
| `app/catalogo/page.tsx` | `category` | `categoria.nombre` (DB) | ✅ OK | Mapeo: `product.categoria?.nombre` |
| `lib/services/products-service.ts` | `sku` | No existe en DB | ⚠️ FALTA | Usar `null` o placeholder |
| `lib/services/products-service.ts` | `status` | No existe en DB | ⚠️ FALTA | Backend devuelve `"ACTIVE"` hardcoded |

## Discrepancias Detectadas

### 1. Campo `sku` no existe en DB
- **Estado:** ⚠️ FALTA
- **Campo en UI:** `sku` (usado en ProductListItem)
- **Campo en DB:** No existe en tabla `productos`
- **Acción:** 
  - Backend devuelve `sku: null`
  - Frontend acepta `sku?: string | null`
  - Si se necesita SKU, usar `id` como fallback o agregar campo en DB

### 2. Campo `status` no existe en DB
- **Estado:** ⚠️ FALTA
- **Campo en UI:** `status` (usado en ProductDetail)
- **Campo en DB:** No existe en tabla `productos`
- **Acción:**
  - Backend devuelve `status: "ACTIVE"` hardcoded
  - Frontend acepta `status: string`
  - Si se necesita status real, agregar campo en DB

### 3. Campo `price` calculado
- **Estado:** ✅ OK (con fallback)
- **Campo en UI:** `price` (usado en cards y detalle)
- **Campo en DB:** `precio` en `variantes_producto` (no en `productos`)
- **Acción:**
  - Backend calcula `price` como `MIN(precio)` de variantes
  - Frontend usa fallback: `product.price ?? product.variantes?.[0]?.precio`

### 4. Campo `slug` calculado
- **Estado:** ✅ OK
- **Campo en UI:** `slug` (usado en URLs)
- **Campo en DB:** No existe, se calcula desde `nombre`
- **Acción:**
  - Backend calcula `slug` usando `slugify(nombre)`
  - Frontend usa `product.slug` directamente

### 5. Campo `image` calculado
- **Estado:** ✅ OK (con fallback)
- **Campo en UI:** `image` (usado en cards y detalle)
- **Campo en DB:** `imagenes_producto.url` (no en `productos`)
- **Acción:**
  - Backend calcula `image` como primera imagen de `imagenes_producto`
  - Frontend usa fallback: `product.image || product.imagenes?.[0]?.url || "/placeholder.svg"`

### 6. Campo `short` calculado
- **Estado:** ✅ OK
- **Campo en UI:** `short` (usado en cards)
- **Campo en DB:** `descripcion` en `productos`
- **Acción:**
  - Backend devuelve `short` igual a `descripcion`
  - Frontend usa fallback: `product.short || product.descripcion`

## Campos Mapeados Correctamente

| Campo UI | Campo DB | Mapeo |
|----------|----------|-------|
| `id` | `productos.id` | ✅ Directo |
| `name` | `productos.nombre` | ✅ `product.name || product.nombre` |
| `marca` | `marcas.nombre` | ✅ `product.marca?.nombre` |
| `categoria` | `categorias.nombre` | ✅ `product.categoria?.nombre` |
| `descripcion` | `productos.descripcion` | ✅ Directo |
| `variantes` | `variantes_producto` | ✅ Array de variantes |
| `imagenes` | `imagenes_producto` | ✅ Array de imágenes |

## Acciones Completadas

1. ✅ **Eliminados mocks** en `app/catalogo/page.tsx`
2. ✅ **Creado cliente API** en `lib/apiClient.ts` con variables de entorno
3. ✅ **Actualizado servicio** en `lib/services/products-service.ts` con tipos del backend
4. ✅ **Corregido página de producto** en `app/producto/[slug]/page.tsx` con mapeo correcto
5. ✅ **Actualizado catálogo** en `app/catalogo/page.tsx` para usar API real
6. ✅ **Creado componente de errores** en `components/api-boundary.tsx`
7. ✅ **Creada ruta temporal** en `app/producto/by-id/[id]/page.tsx` para migración
8. ✅ **Links actualizados** para usar `slug` en lugar de `id`

## Variables de Entorno

**Archivo:** `.env.local`
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_API_PREFIX=/api/v1
```

**Verificación:** ✅ Variables leídas correctamente en `lib/apiClient.ts`

## Endpoints Usados

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/v1/products` | GET | Lista de productos con filtros y paginación |
| `/api/v1/products/{slug}` | GET | Detalle de producto por slug |
| `/api/v1/products/by-id/{id}` | GET | Detalle de producto por ID (temporal) |
| `/api/v1/products/{slug}/variants` | GET | Variantes de producto |
| `/api/v1/inventory/stock/{variant_id}` | GET | Stock de variante (no usado aún) |
| `/api/v1/health` | GET | Health check (no usado en UI) |

## TODO

1. **Generar tipos desde OpenAPI:**
   ```bash
   npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts
   ```
   Luego actualizar `lib/services/products-service.ts` para usar tipos generados.

2. **Agregar campo `sku` en DB** (si se necesita):
   - Agregar columna `sku` en tabla `productos`
   - Actualizar modelo SQLAlchemy
   - Actualizar migración Alembic

3. **Agregar campo `status` en DB** (si se necesita):
   - Agregar columna `status` en tabla `productos`
   - Actualizar modelo SQLAlchemy
   - Actualizar migración Alembic

4. **Migrar completamente a slug:**
   - Eliminar ruta temporal `/producto/by-id/[id]`
   - Verificar que todos los links usen `slug`

5. **Implementar SSG/ISR** (opcional):
   - Agregar `export const revalidate = 60` en páginas estáticas
   - Usar `cache: "force-cache"` para datos que no cambian frecuentemente

## Notas Finales

- ✅ No quedan mocks en el código
- ✅ Todas las llamadas pasan por `lib/services/products-service.ts`
- ✅ Variables de entorno configuradas y leídas correctamente
- ✅ Manejo de errores implementado
- ✅ Paginación funcionando
- ✅ Filtros funcionando (backend + frontend)
- ⚠️ Algunos campos calculados (`sku`, `status`) no existen en DB pero se manejan con fallbacks

