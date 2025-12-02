# 📋 Recomendaciones: ¿Qué Tablas Deberías Usar?

## ✅ **TABLAS QUE SÍ DEBERÍAS USAR** (Funcionalidades importantes)

### 1. **Facturas de Venta** ⚠️ **IMPORTANTE**
**¿Por qué?**
- En Bolivia, las facturas son **obligatorias** para ventas formales
- Necesitas emitir facturas fiscales con número de factura, NIT, etc.
- Las órdenes de venta actuales son solo "pedidos", no facturas legales

**Qué hacer:**
- Implementar `facturas_venta` y `items_factura_venta`
- Vincular facturas con órdenes de venta
- Generar números de factura secuenciales
- Incluir datos fiscales (NIT, razón social, etc.)

**Prioridad:** 🔴 **ALTA** (Requisito legal en Bolivia)

---

### 2. **Pagos de Cliente** 💰 **ÚTIL**
**¿Por qué?**
- Los clientes pueden pagar a plazos o en múltiples cuotas
- Necesitas registrar cuándo y cómo pagaron
- Para créditos y seguimiento de pagos pendientes

**Qué hacer:**
- Implementar `pagos_cliente`
- Vincular pagos con órdenes de venta o facturas
- Registrar método de pago (efectivo, transferencia, cheque, etc.)
- Seguimiento de pagos parciales

**Prioridad:** 🟡 **MEDIA** (Útil si manejas créditos)

---

### 3. **Envíos** 📦 **ÚTIL (si haces delivery)**
**¿Por qué?**
- Si entregas productos a domicilio, necesitas rastrear envíos
- Estado del envío (preparando, en camino, entregado)
- Información de dirección de entrega

**Qué hacer:**
- Implementar `envios` y `items_envio`
- Vincular con órdenes de venta
- Agregar estados de envío
- Direcciones de entrega

**Prioridad:** 🟡 **MEDIA** (Solo si haces delivery)

---

### 4. **Contactos de Proveedores** 📞 **ÚTIL**
**¿Por qué?**
- Los proveedores pueden tener múltiples contactos (vendedor, gerente, etc.)
- Diferentes números de teléfono para diferentes asuntos

**Qué hacer:**
- Implementar `contactos_proveedor`
- Vincular con `proveedores`
- Campos: nombre, cargo, teléfono, email

**Prioridad:** 🟢 **BAJA** (Puedes poner todo en la tabla proveedores)

---

## ❌ **TABLAS QUE NO NECESITAS** (Para una ferretería)

### 1. **Facturas de Proveedor** ❌
**Razón:** 
- Si compras a proveedores, puedes usar `ordenes_compra` directamente
- No necesitas facturas separadas a menos que tengas un sistema contable complejo

---

### 2. **Pagos a Proveedores** ❌
**Razón:**
- Puedes registrar pagos en `ordenes_compra` con un campo `estado_pago`
- No necesitas tabla separada a menos que manejes muchos proveedores con créditos

---

### 3. **Direcciones Separadas** ❌
**Razón:**
- Los clientes ya tienen `direccion` en la tabla `clientes`
- Solo necesitarías tabla separada si un cliente tiene múltiples direcciones (envío, facturación, etc.)

---

### 4. **Contactos de Clientes** ❌
**Razón:**
- Los clientes ya tienen teléfono y email en su tabla
- Solo necesitarías esto si un cliente tiene múltiples contactos (ej: empresa con varios empleados)

---

### 5. **Garantías** ❌
**Razón:**
- Para una ferretería, las garantías son simples (30 días, 90 días, etc.)
- Puedes agregar un campo `garantia_dias` en `variantes_producto`
- No necesitas tabla separada a menos que quieras rastrear cada garantía individualmente

---

### 6. **Programas de Fidelidad** ❌
**Razón:**
- Funcionalidad compleja que requiere mucho desarrollo
- Puedes implementarla después si el negocio crece
- Por ahora, no es prioridad

---

### 7. **Notificaciones** ❌
**Razón:**
- Puedes usar email directamente sin tabla de notificaciones
- Solo necesitarías esto si quieres un sistema de notificaciones push o SMS

---

### 8. **Chatbot e IA** ❌
**Razón:**
- Funcionalidades avanzadas que no son necesarias ahora
- Puedes implementarlas en el futuro si es necesario

---

### 9. **Conteos Cíclicos, Lotes, Ubicaciones Bin** ❌
**Razón:**
- Son para inventarios muy complejos (almacenes grandes, productos con lotes, etc.)
- Para una ferretería, el inventario simple es suficiente
- Puedes implementarlos después si creces

---

### 10. **Listas de Precios** ❌
**Razón:**
- Puedes tener precios diferentes por cliente usando `promociones`
- Solo necesitarías listas de precios si tienes muchos clientes con precios especiales

---

## 🎯 **MI RECOMENDACIÓN FINAL**

### **Implementar AHORA:**
1. ✅ **Facturas de Venta** (🔴 ALTA - Requisito legal)
2. ✅ **Pagos de Cliente** (🟡 MEDIA - Si manejas créditos)

### **Implementar DESPUÉS (si creces):**
3. 📦 **Envíos** (Si empiezas a hacer delivery)
4. 📞 **Contactos de Proveedores** (Si tienes muchos proveedores)

### **Eliminar (No necesitas):**
- Todo lo demás de la lista de "no necesitas"

---

## 💡 **Estrategia Recomendada**

1. **Fase 1 (Ahora):**
   - Eliminar todas las tablas que definitivamente no usarás
   - Implementar `facturas_venta` (requisito legal)
   - Implementar `pagos_cliente` (si manejas créditos)

2. **Fase 2 (Futuro):**
   - Agregar `envios` si empiezas delivery
   - Agregar funcionalidades avanzadas solo si realmente las necesitas

3. **Principio:**
   - **"No construyas lo que no necesitas"** - YAGNI (You Aren't Gonna Need It)
   - Es mejor tener una base de datos simple y agregar funcionalidades cuando realmente las necesites

---

## ⚠️ **IMPORTANTE: Facturas en Bolivia**

En Bolivia, las facturas son **obligatorias** para:
- Ventas formales
- Declaraciones de impuestos
- Control fiscal

**Tu sistema actual:**
- `ordenes_venta` = Pedidos/Órdenes (no son facturas legales)
- Necesitas `facturas_venta` = Facturas fiscales (con número de factura, NIT, etc.)

**Recomendación:** Implementa facturas lo antes posible para cumplir con la ley.

