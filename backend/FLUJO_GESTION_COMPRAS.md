# 📦 Flujo de Gestión de Compras

## 🎯 Casos de Uso

### **1. EMPLEADO - Registrar Recepción**
**Flujo:**
1. Empleado recibe mercancía del proveedor
2. Registra la recepción (qué productos, cantidades recibidas)
3. Asocia factura del proveedor / Procesa pago
4. Cierra el pedido

**Estados:**
- `ENVIADO` → `RECIBIDO` → `FACTURADO` → `CERRADO`

---

### **2. EMPLEADO - Crear/Editar Pedido**
**Flujo:**
1. Empleado crea o edita orden de compra
2. Agrega productos, cantidades, precios
3. Selecciona proveedor
4. Envía pedido al proveedor

**Estados:**
- `BORRADOR` → `ENVIADO`

---

### **3. ADMINISTRADOR - Crear/Editar Pedido**
**Flujo:**
1. Administrador crea o edita orden de compra
2. Agrega productos, cantidades, precios
3. Selecciona proveedor
4. Envía pedido al proveedor
5. Puede cerrar pedido directamente (si ya está recibido y facturado)

**Estados:**
- `BORRADOR` → `ENVIADO` → `CERRADO`

---

### **4. PROVEEDOR - Recibir Respuesta**
**Flujo:**
1. Proveedor recibe la orden de compra enviada
2. Proveedor confirma o rechaza la orden
3. Si confirma, puede actualizar precios/cantidades
4. Responde al sistema

**Estados:**
- `ENVIADO` → `CONFIRMADO` / `RECHAZADO`

---

## 📊 Estados de Orden de Compra

```
BORRADOR → ENVIADO → CONFIRMADO → RECIBIDO → FACTURADO → CERRADO
                ↓
            RECHAZADO
```

### **Estados:**
- **BORRADOR**: Pedido en creación, no enviado
- **ENVIADO**: Pedido enviado al proveedor, esperando respuesta
- **CONFIRMADO**: Proveedor confirmó el pedido
- **RECHAZADO**: Proveedor rechazó el pedido
- **RECIBIDO**: Mercancía recibida físicamente
- **FACTURADO**: Factura asociada y pago procesado
- **CERRADO**: Pedido completado

---

## 🔧 Endpoints Necesarios

### **Backend:**
1. `POST /purchases` - Crear orden de compra (BORRADOR)
2. `PUT /purchases/{id}` - Editar orden de compra (solo si BORRADOR)
3. `POST /purchases/{id}/send` - Enviar pedido al proveedor (BORRADOR → ENVIADO)
4. `POST /purchases/{id}/confirm` - Proveedor confirma pedido (ENVIADO → CONFIRMADO)
5. `POST /purchases/{id}/reject` - Proveedor rechaza pedido (ENVIADO → RECHAZADO)
6. `POST /purchases/{id}/receive` - Registrar recepción (CONFIRMADO → RECIBIDO)
7. `POST /purchases/{id}/invoice` - Asociar factura/Procesar pago (RECIBIDO → FACTURADO)
8. `POST /purchases/{id}/close` - Cerrar pedido (FACTURADO → CERRADO)

### **Frontend:**
- Página de listado de órdenes de compra
- Página de crear/editar orden
- Página de recepción de mercancía
- Página de asociar factura/procesar pago
- Vista de proveedor para confirmar/rechazar

---

## 📋 Campos Necesarios en OrdenCompra

```python
- id
- proveedor_id
- fecha
- estado (BORRADOR, ENVIADO, CONFIRMADO, RECHAZADO, RECIBIDO, FACTURADO, CERRADO)
- usuario_id
- fecha_envio (cuándo se envió al proveedor)
- fecha_confirmacion (cuándo el proveedor confirmó)
- fecha_recepcion (cuándo se recibió físicamente)
- fecha_facturacion (cuándo se asoció factura)
- fecha_cierre (cuándo se cerró)
- numero_factura_proveedor
- observaciones
```

---

## 🔐 Permisos

- **ADMIN**: Puede crear, editar, enviar, recibir, facturar, cerrar
- **INVENTARIOS**: Puede crear, editar, enviar, recibir, facturar, cerrar
- **PROVEEDOR** (rol especial): Puede confirmar/rechazar pedidos enviados

---

## 📝 Notas

- Solo se puede editar si está en estado `BORRADOR`
- Solo se puede enviar si está en estado `BORRADOR`
- Solo se puede recibir si está en estado `CONFIRMADO`
- Solo se puede facturar si está en estado `RECIBIDO`
- Solo se puede cerrar si está en estado `FACTURADO`

