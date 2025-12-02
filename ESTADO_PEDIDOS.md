# Actualización de Estado de Pedidos en el Admin

## 📍 Ubicación en el Admin

El estado de los pedidos se actualiza en el **módulo de Ventas** (`/admin/sales`), específicamente en dos secciones:

### 1. **Pagos y Cobranzas** 💳
**Ubicación:** Módulo Ventas → Acción "Pagos y cobranzas"

**Función:** Cambiar el estado de **PENDIENTE** → **PAGADO**

**Cómo funciona:**
- Seleccionas una orden con estado "PENDIENTE"
- Ingresas el monto pagado
- Seleccionas el método de pago (Efectivo, Tarjeta, Transferencia)
- Opcionalmente agregas una referencia/comprobante
- Al registrar el pago, la orden cambia automáticamente a estado "PAGADO"

**Código relacionado:**
- Frontend: `frontend/app/admin/sales/page.tsx` (función `handlePaymentSubmit`)
- Backend: `backend/app/api/v1/sales.py` (endpoint para actualizar estado)

---

### 2. **Envíos y Entregas** 🚚
**Ubicación:** Módulo Ventas → Acción "Envíos y entregas"

**Función:** Cambiar el estado de **PAGADO** → **ENVIADO** o **ENTREGADO**

**Cómo funciona:**
- Seleccionas una orden con estado "PAGADO"
- Seleccionas el método de envío (Retiro en tienda / Envío a domicilio)
- Opcionalmente agregas un número de seguimiento
- Agregas notas sobre el envío
- Al confirmar el envío, la orden cambia a estado "ENVIADO"
- Cuando se confirma la entrega, cambia a estado "ENTREGADO"

**Código relacionado:**
- Frontend: `frontend/app/admin/sales/page.tsx` (función `handleLogisticsSubmit`)
- Backend: `backend/app/api/v1/sales.py` (endpoint para actualizar estado de envío)

---

## 🔄 Flujo de Estados

```
PENDIENTE → PAGADO → ENVIADO → ENTREGADO
   ↓           ↓         ↓          ↓
 Cliente    Admin    Admin     Admin
 realiza   registra  registra  confirma
 pedido    pago     envío     entrega
```

### Estados Disponibles:
- **PENDIENTE**: El cliente realizó el pedido pero aún no ha pagado
- **PAGADO**: El pago ha sido registrado por el admin
- **ENVIADO**: La orden ha sido enviada/despachada
- **ENTREGADO**: La orden ha sido entregada al cliente
- **CANCELADO**: La orden fue cancelada (estado especial)

---

## ⚠️ Nota Importante

Actualmente, la funcionalidad de actualización de estado está **parcialmente implementada** en el frontend pero requiere que el backend tenga los endpoints correspondientes. El código muestra `TODO` comentarios indicando que la API está en construcción.

Para que funcione completamente, necesitas:
1. Implementar el endpoint `PATCH /sales/{order_id}/status` en el backend
2. Implementar el endpoint `POST /sales/{order_id}/payment` para registrar pagos
3. Implementar el endpoint `POST /sales/{order_id}/shipping` para registrar envíos

---

## 📝 Archivos Relacionados

- **Frontend:**
  - `frontend/app/admin/sales/page.tsx` - Interfaz de usuario para gestionar estados
  - `frontend/lib/services/sales-service.ts` - Servicio para llamar a la API

- **Backend:**
  - `backend/app/api/v1/sales.py` - Endpoints de ventas (actualmente solo lectura)
  - `backend/app/services/sale_service.py` - Lógica de negocio para ventas
  - `backend/app/models/venta.py` - Modelo de datos de órdenes de venta

