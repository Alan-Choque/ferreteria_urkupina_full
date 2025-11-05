# Cambios Frontend - Integración con Backend FastAPI

## Resumen de Cambios

### 0. Auditoría del Repo

**Archivos detectados:**
- ✅ `app/page.tsx` - Página principal (home)
- ✅ `app/producto/[slug]/page.tsx` - Página de detalle de producto (ya usaba slug)
- ✅ `app/catalogo/page.tsx` - Catálogo con mocks (actualizado)
- ✅ `lib/services/products-service.ts` - Servicio de productos (actualizado)
- ✅ `lib/api.ts` - Cliente API básico (mantenido por compatibilidad)
- ✅ `components/category-grid.tsx` - Grid de categorías (estático)
- ✅ `components/editorial-section.tsx` - Sección editorial (estático)

**Mocks eliminados:**
- ❌ `app/catalogo/page.tsx` - Eliminados productos hardcoded, ahora usa API

### 1. Variables y Tipos

**Archivo creado:**
- `.env.local` - Variables de entorno:
  ```
  NEXT_PUBLIC_API_BASE=http://localhost:8000
  NEXT_PUBLIC_API_PREFIX=/api/v1
  ```

**Archivo creado:**
- `lib/apiClient.ts` - Cliente API tipado con variables de entorno

**Archivo actualizado:**
- `lib/services/products-service.ts` - Tipos actualizados según backend FastAPI

**Nota:** Para generar tipos completos desde OpenAPI:
```bash
npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts
```
Luego actualizar `lib/services/products-service.ts` para usar tipos generados.

### 2. Cliente API y Helpers

**Archivo creado:** `lib/apiClient.ts`
- `API_BASE` y `API_PREFIX` desde variables de entorno
- `apiFetch<T>()` con manejo de errores
- Métodos `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.delete()`

**Archivo actualizado:** `lib/services/products-service.ts`
- Métodos actualizados para usar `api` desde `apiClient`
- Tipos actualizados según backend:
  - `ProductListItem` con campos: `id`, `name`, `slug`, `image`, `short`, `price`, `marca`, `categoria`, `variantes`, `imagenes`
  - `ProductListResponse` con `items`, `page`, `page_size`, `total`
  - `ProductVariant` con `id`, `nombre`, `precio`, `unidad_medida_nombre`
  - `StockResponse` para inventario

### 3. Página de Producto Corregida

**Archivo actualizado:** `app/producto/[slug]/page.tsx`
- ✅ Ya usaba `params.slug` correctamente
- ✅ Actualizado para usar `productsService.getProductBySlug()`
- ✅ Mapeo de campos del backend a UI:
  - `name` o `nombre` → título
  - `image` o `imagenes[0].url` → imagen principal
  - `short` o `descripcion` → descripción corta
  - `price` o `variantes[0].precio` → precio
- ✅ Manejo de errores con `notFound()`
- ✅ Renderizado de variantes

**Archivo creado:** `app/producto/by-id/[id]/page.tsx` (temporal)
- Endpoint temporal para migración gradual
- Redirige a slug si está disponible
- Fallback a mostrar producto por ID

### 4. Listas, Cards y Paginación

**Archivo actualizado:** `app/catalogo/page.tsx`
- ❌ Eliminados mocks hardcoded
- ✅ Usa `productsService.listProducts()` con parámetros
- ✅ Filtros: `q`, `brand_id`, `category_id` (enviados al backend)
- ✅ Filtros locales: precio, disponibilidad (filtrado en frontend)
- ✅ Paginación con `page`, `page_size`, `total`
- ✅ Botones "Anterior/Siguiente"
- ✅ Loading y error states
- ✅ Links actualizados para usar `slug`: `/producto/${productSlug}`

**Campos usados en Cards:**
- `id` - Key de React
- `name` o `nombre` - Título del producto
- `slug` - URL del producto
- `image` o `imagenes[0].url` - Imagen principal
- `short` o `descripcion` - Descripción corta (no se muestra en grid)
- `price` o `variantes[0].precio` - Precio
- `marca.nombre` - Nombre de marca
- `categoria.nombre` - Nombre de categoría

### 5. Eliminación de Mocks

**Mocks eliminados:**
- ❌ `app/catalogo/page.tsx` - Array `allProducts` hardcoded eliminado

**Servicios mantenidos:**
- ✅ `lib/services/products-service.ts` - Actualizado para usar API real
- ✅ `lib/api.ts` - Mantenido por compatibilidad (puede ser deprecado)

### 6. Manejo de Errores y Estados

**Archivo creado:** `components/api-boundary.tsx`
- `LoadingState` - Componente de carga
- `ErrorState` - Componente de error con botón de reintentar
- `ApiBoundary` - Wrapper para errores (extensible)

**Uso:**
- `app/catalogo/page.tsx` - Usa `LoadingState` y `ErrorState`
- `app/producto/[slug]/page.tsx` - Usa `notFound()` de Next.js

### 7. Links Corregidos

**Archivos actualizados:**
- ✅ `app/catalogo/page.tsx` - Links usan `slug`: `/producto/${productSlug}`
- ✅ `app/producto/[slug]/page.tsx` - Ya usaba slug correctamente

**Fallback:**
- Si `slug` no está disponible, se usa `id` como fallback: `/producto/${product.slug || product.id}`

## Campos Asumidos del Backend

### ProductListItem (respuesta de GET /api/v1/products)
- `id` (number) - ID del producto
- `nombre` (string) - Nombre del producto (mapeado a `name` en UI)
- `slug` (string) - Slug calculado desde nombre
- `image` (string | null) - Primera imagen o null
- `short` (string | null) - Descripción corta (igual a `descripcion`)
- `price` (number | null) - Precio mínimo de variantes
- `marca` ({id, nombre} | null) - Marca del producto
- `categoria` ({id, nombre} | null) - Categoría del producto
- `variantes` (array) - Variantes del producto
- `imagenes` (array) - Imágenes del producto

### ProductDetail (respuesta de GET /api/v1/products/{slug})
- Todos los campos de `ProductListItem`
- `descripcion` (string | null) - Descripción completa

### ProductVariant (respuesta de GET /api/v1/products/{slug}/variants)
- `id` (number) - ID de la variante
- `nombre` (string | null) - Nombre de la variante
- `precio` (number | null) - Precio de la variante
- `unidad_medida_nombre` (string | null) - Nombre de la unidad de medida

## Comandos Post-Cambio

```bash
# 1. Instalar dependencias (si falta openapi-typescript)
npm install --save-dev openapi-typescript

# 2. Generar tipos desde OpenAPI (opcional)
npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts

# 3. Verificar variables de entorno
cat .env.local
# Debe mostrar:
# NEXT_PUBLIC_API_BASE=http://localhost:8000
# NEXT_PUBLIC_API_PREFIX=/api/v1

# 4. Ejecutar servidor de desarrollo
npm run dev

# 5. Verificar en navegador
# http://localhost:3000/catalogo
# http://localhost:3000/producto/{slug}
```

## Pruebas Manuales

### ✅ Verificar:
1. **Home / Catálogo renderiza items reales**
   - Abrir `http://localhost:3000/catalogo`
   - Debe mostrar productos desde API
   - No debe mostrar mocks

2. **Navegación a /producto/[slug] carga el detalle correcto**
   - Click en un producto del catálogo
   - Debe navegar a `/producto/{slug}`
   - Debe mostrar detalles del producto

3. **Filtros funcionan**
   - Buscar por nombre
   - Filtrar por categoría
   - Filtrar por marca
   - Paginación funciona

4. **Consola del navegador**
   - No deben aparecer 404/500 del backend
   - Si aparecen, revisar URL y corregir

## Notas Importantes

1. **Campos calculados:** El backend calcula `slug`, `image`, `price` desde otros campos. Si faltan, se usan fallbacks.

2. **Migración gradual:** Si el frontend aún usa IDs en algunos lugares, usar `/producto/by-id/{id}` temporalmente.

3. **Tipos OpenAPI:** Los tipos actuales son manuales. Para tipos completos, generar desde OpenAPI.

4. **Cache:** Los fetch usan `cache: "no-store"` para datos dinámicos. Para SSG/ISR, usar `revalidate`.

5. **Variables de entorno:** Asegurar que `.env.local` existe y tiene las variables correctas.

## Archivos Modificados/Creados

### Creados:
- `.env.local`
- `lib/apiClient.ts`
- `components/api-boundary.tsx`
- `app/producto/by-id/[id]/page.tsx`
- `CAMBIOS_FRONTEND.md`

### Modificados:
- `lib/services/products-service.ts`
- `app/producto/[slug]/page.tsx`
- `app/catalogo/page.tsx`

### Mantenidos (compatibilidad):
- `lib/api.ts` - Puede ser deprecado en el futuro

