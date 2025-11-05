# Integración Frontend - Backend FastAPI

## Resumen

Frontend Next.js 14 conectado al backend FastAPI en `http://localhost:8000/api/v1`.

## Configuración

### Variables de Entorno

Archivo: `.env.local`
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_API_PREFIX=/api/v1
```

### Verificar Variables

```bash
# En el código, verificar que se leen correctamente:
console.log(process.env.NEXT_PUBLIC_API_BASE); // http://localhost:8000
console.log(process.env.NEXT_PUBLIC_API_PREFIX); // /api/v1
```

## Archivos Modificados/Creados

### Creados:
- `.env.local` - Variables de entorno
- `lib/apiClient.ts` - Cliente API tipado
- `components/api-boundary.tsx` - Componentes de loading/error
- `app/producto/by-id/[id]/page.tsx` - Ruta temporal para migración
- `CAMBIOS_FRONTEND.md` - Documentación de cambios
- `AUDIT_UI_DB.md` - Auditoría UI ↔ DB
- `README_INTEGRACION.md` - Este archivo

### Modificados:
- `lib/services/products-service.ts` - Actualizado para usar API real
- `lib/api.ts` - Actualizado para usar `apiClient.ts`
- `app/producto/[slug]/page.tsx` - Corregido y actualizado
- `app/catalogo/page.tsx` - Eliminados mocks, usa API real

## Campos Usados en UI

### ProductCard / ProductListItem
- `id` - ID del producto
- `nombre` - Nombre del producto (backend devuelve `nombre`, no `name`)
- `slug` - Slug para URLs
- `image` - Primera imagen o `imagenes[0].url`
- `short` - Descripción corta o `descripcion`
- `price` - Precio del producto o `variantes[0].precio`
- `marca.nombre` - Nombre de marca
- `categoria.nombre` - Nombre de categoría

### ProductDetail
- Todos los campos de ProductListItem
- `descripcion` - Descripción completa
- `variantes` - Array de variantes
- `imagenes` - Array de imágenes

## Mapeo de Campos

| Campo UI | Campo Backend | Mapeo |
|----------|---------------|-------|
| `name` | `nombre` | `product.nombre || product.name` |
| `image` | `image` o `imagenes[0].url` | `product.image || product.imagenes?.[0]?.url` |
| `short` | `short` o `descripcion` | `product.short || product.descripcion` |
| `price` | `price` o `variantes[0].precio` | `product.price ?? product.variantes?.[0]?.precio` |
| `slug` | `slug` (calculado) | `product.slug` |
| `sku` | `null` (no existe) | `product.sku || null` |
| `status` | `"ACTIVE"` (hardcoded) | `product.status || "ACTIVE"` |

## Endpoints Usados

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/v1/products` | GET | Lista de productos |
| `/api/v1/products/{slug}` | GET | Detalle por slug |
| `/api/v1/products/by-id/{id}` | GET | Detalle por ID (temporal) |
| `/api/v1/products/{slug}/variants` | GET | Variantes de producto |
| `/api/v1/inventory/stock/{variant_id}` | GET | Stock de variante |

## Comandos

```bash
# 1. Instalar dependencias
npm install

# 2. Verificar variables de entorno
cat .env.local

# 3. Ejecutar servidor de desarrollo
npm run dev

# 4. Generar tipos desde OpenAPI (opcional)
npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts

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

## Troubleshooting

### Error: "Cannot read property 'nombre' of undefined"
- **Causa:** El backend devuelve `nombre` pero el código espera `name`
- **Solución:** Usar `product.nombre || product.name`

### Error: "API 404 Not Found"
- **Causa:** URL incorrecta o backend no está corriendo
- **Solución:** Verificar `.env.local` y que backend esté en `http://localhost:8000`

### Error: "slug no existe"
- **Causa:** El backend no devuelve `slug` o el cálculo falla
- **Solución:** Usar fallback: `product.slug || String(product.id)`

### Error: "price is null"
- **Causa:** El producto no tiene precio en variantes
- **Solución:** Usar fallback: `product.price ?? product.variantes?.[0]?.precio ?? null`

## Notas

1. **Campos calculados:** El backend calcula `slug`, `image`, `price` desde otros campos
2. **Migración gradual:** Si el frontend aún usa IDs, usar `/producto/by-id/{id}` temporalmente
3. **Tipos OpenAPI:** Los tipos actuales son manuales. Para tipos completos, generar desde OpenAPI
4. **Cache:** Los fetch usan `cache: "no-store"` para datos dinámicos. Para SSG/ISR, usar `revalidate`

