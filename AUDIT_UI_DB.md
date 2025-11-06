# Auditoría UI vs DB - Ferretería Urkupina

## Resumen

Este documento detalla las discrepancias encontradas entre la UI y la base de datos, y las acciones tomadas para resolverlas.

## Tabla de Discrepancias

| Componente/Página | Campo en UI | Campo en API/DB | Estado | Acción |
|------------------|-------------|-----------------|--------|--------|
| **Productos - Lista** | `name` | `nombre` | ✅ Resuelto | Mapper en `products-service.ts` usa `nombre`, expone `name` opcional para compatibilidad |
| **Productos - Lista** | `image` | No existe | ✅ Resuelto | Usa `imagenes[0].url` o `null` |
| **Productos - Lista** | `short` | `descripcion` | ✅ Resuelto | Usa `descripcion` como `short` |
| **Productos - Lista** | `price` | No existe | ✅ Resuelto | Usa `MIN(variantes.precio)` o `null` |
| **Productos - Lista** | `sku` | No existe | ✅ Resuelto | Retorna `null` (no existe en DB) |
| **Productos - Lista** | `slug` | No existe | ✅ Resuelto | Calculado desde `nombre` en backend |
| **Productos - Lista** | `status` | No existe | ✅ Resuelto | Hardcoded como `"ACTIVE"` |
| **Productos - Detalle** | `name` | `nombre` | ✅ Resuelto | Mapper en página usa `nombre || name` |
| **Productos - Detalle** | `image` | `imagenes[0].url` | ✅ Resuelto | Usa primera imagen de `imagenes` |
| **Productos - Detalle** | `price` | `variantes[0].precio` | ✅ Resuelto | Usa precio de primera variante |
| **Auth - Login** | `email`, `password` | `correo`, `hash_contrasena` | ✅ Resuelto | Backend recibe `email`, busca por `correo` |
| **Auth - Register** | `username`, `email`, `password` | `nombre_usuario`, `correo`, `hash_contrasena` | ✅ Resuelto | Mapper en backend normaliza campos |
| **Auth - User Response** | `name`, `email` | `nombre_usuario`, `correo` | ✅ Resuelto | `auth-service.ts` convierte `UserResponse` a `AdminUser` |

## Campos Calculados (DTOs)

### Productos
- **`slug`**: Calculado desde `nombre` usando `slugify` en backend
- **`image`**: Primera imagen de `dbo.imagenes_producto` (url)
- **`short`**: Igual a `descripcion`
- **`price`**: `MIN(precio)` de `dbo.variantes_producto` para el producto
- **`status`**: Hardcoded como `"ACTIVE"` (no existe en DB)

### Usuarios
- **`name`**: Mapeado desde `nombre_usuario`
- **`email`**: Mapeado desde `correo`
- **`role`**: Primera entrada de `roles` array

## Decisiones de Diseño

1. **No modificar esquema DB**: Los campos calculados se generan en el backend (DTOs) o frontend (mappers), sin tocar la estructura de la base de datos.

2. **Compatibilidad hacia atrás**: El frontend mantiene campos como `name` y `image` para compatibilidad con componentes existentes, pero internamente usa `nombre` y `imagenes[0].url`.

3. **Fallbacks**: Si un campo no existe, se usa `null` o un valor por defecto (ej: `status: "ACTIVE"`).

## Campos que Faltan en DB (Opcional para Futuro)

| Campo | Uso | Prioridad | Nota |
|-------|-----|-----------|------|
| `productos.sku` | Identificación única | Baja | Se puede generar desde ID |
| `productos.slug` | URLs amigables | Baja | Se calcula desde `nombre` |
| `productos.status` | Activo/Inactivo | Media | Por ahora hardcoded como "ACTIVE" |
| `productos.precio` | Precio directo | Baja | Se usa `MIN(variantes.precio)` |

## Campos que Sobran en UI (Eliminados)

| Campo | Componente | Acción |
|-------|------------|--------|
| `firstName`, `lastName`, `phone`, etc. | `app/register/page.tsx` | ✅ Eliminados - Formulario simplificado para coincidir con backend |

## Estado Final

✅ **Todos los campos UI están mapeados a DB o calculados**
✅ **No hay campos que rompan la aplicación**
✅ **Compatibilidad mantenida con componentes existentes**
✅ **Documentación completa de mapeos**

## Próximos Pasos (Opcional)

1. **Agregar campos faltantes a DB** (si se requieren):
   - `productos.sku`: Para identificación única
   - `productos.status`: Para control de activación/desactivación
   - `productos.precio`: Para precio directo (opcional, ya se calcula desde variantes)

2. **Generar tipos desde OpenAPI**:
   ```bash
   npx openapi-typescript http://localhost:8000/openapi.json -o types/api.d.ts
   ```

3. **Actualizar componentes** para usar tipos generados directamente.

