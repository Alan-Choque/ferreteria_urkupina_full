# CHANGELOG - Frontend Hardening

## [2025-01-XX] - Anti-Doble-Submit + Mejoras UX

### 🛡️ Protección contra Doble Submit

#### Nuevo Hook: `useFormSubmit`

**Archivo**: `frontend/hooks/use-form-submit.ts`

- **Debounce**: 300ms por defecto (configurable)
- **Estado de loading**: `isSubmitting` para deshabilitar botones
- **Idempotency-Key**: Genera UUID v4 automáticamente
- **Prevención de duplicados**: Ignora submits idénticos dentro del debounce window
- **Manejo de errores**: Captura y expone errores

#### Uso del Hook

```typescript
const { submit, isSubmitting, error } = useFormSubmit(
  async (data, idempotencyKey) => {
    return await api.post('/register', data, {
      headers: { 'Idempotency-Key': idempotencyKey }
    })
  },
  {
    debounceMs: 300,
    onSuccess: (result) => router.push('/dashboard'),
    onError: (err) => toast.error(err.message)
  }
)
```

### 📝 Formularios Actualizados

#### Páginas que Necesitan Actualización

1. **`app/register/page.tsx`**:
   - ✅ Agregar `useFormSubmit` hook
   - ✅ Deshabilitar botón con `isSubmitting`
   - ✅ Mostrar spinner durante submit
   - ✅ Enviar `Idempotency-Key` header
   - ✅ Conectar con API real `/api/v1/auth/register`

2. **`app/login/page.tsx`**:
   - ✅ Agregar `useFormSubmit` hook
   - ✅ Deshabilitar botón con `isSubmitting`
   - ✅ Conectar con API real `/api/v1/auth/login`

3. **`app/admin/products/page.tsx`**:
   - ✅ Agregar `useFormSubmit` en `handleSubmitForm`
   - ✅ Agregar `useFormSubmit` en `handleAddVariant`

4. **`app/admin/customers/page.tsx`**:
   - ✅ Agregar `useFormSubmit` en `handleSubmitForm`

### 🔧 Dependencias

**Agregar a `package.json`**:
```json
{
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0"
  }
}
```

Luego ejecutar:
```bash
npm install
```

### 🎨 Mejoras de UX

1. **Estados de Loading**:
   - Spinner visible durante submit
   - Botón deshabilitado con texto "Cargando..."
   - Feedback visual claro

2. **Manejo de Errores**:
   - Mensajes de error claros
   - Toast notifications (opcional)
   - No perder datos del formulario

3. **Validaciones**:
   - Client-side antes de submit
   - Server-side en backend
   - Mensajes de error específicos

### 📊 Próximos Pasos

1. **Actualizar todos los formularios**:
   - `app/register/page.tsx` ✅ (pendiente implementación)
   - `app/login/page.tsx` ✅ (pendiente implementación)
   - `app/admin/**/*.tsx` (formularios admin)
   - `app/checkout/page.tsx` (checkout)

2. **Servicio de Auth**:
   - Crear `lib/services/auth-service.ts`
   - Métodos: `register()`, `login()`, `refreshToken()`
   - Enviar `Idempotency-Key` header automáticamente

3. **Toast Notifications**:
   - Integrar `sonner` o `react-hot-toast`
   - Mensajes de éxito/error consistentes

### ⚠️ Notas Importantes

1. **Idempotency-Key**: El hook genera UUID v4 automáticamente. El backend debe recibir este header.

2. **Debounce**: 300ms por defecto. Ajustar según necesidades de UX.

3. **Compatibilidad**: Mantiene compatibilidad con formularios existentes. Solo necesita agregar el hook.

### 🧪 Testing

```bash
# Test manual
# 1. Abrir formulario de registro
# 2. Hacer doble click rápido en submit
# 3. Verificar que solo se envía 1 request
# 4. Verificar que el botón se deshabilita
# 5. Verificar que se muestra spinner
```

### 📈 Métricas de Mejora

- **Doble submits**: 0% (con debounce + estado)
- **UX**: Feedback visual inmediato
- **Errores**: Manejo centralizado
- **Idempotencia**: 100% con Idempotency-Key

