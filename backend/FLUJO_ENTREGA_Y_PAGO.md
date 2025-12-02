# 📦 Flujo Realista de Entrega y Pago - Ferretería

## 🎯 Escenarios Reales en una Ferretería

### **Escenario 1: Pago Anticipado (Pre-pago)**
```
1. Cliente hace pedido → Estado: PENDIENTE
2. Cliente paga (transferencia/efectivo) → Estado: PAGADO
3. Se genera factura automáticamente
4. Se prepara el pedido → Estado: PREPARANDO
5. Se envía/entrega → Estado: ENVIADO
6. Cliente recibe → Estado: ENTREGADO
```

### **Escenario 2: Pago Contra Entrega (COD - Cash on Delivery)**
```
1. Cliente hace pedido → Estado: PENDIENTE, metodo_pago: "CONTRA_ENTREGA"
2. Se prepara el pedido → Estado: PREPARANDO
3. Se envía/entrega → Estado: EN_ENVIO
4. Repartidor entrega y cobra → Estado: ENTREGADO, Pago registrado
5. Se genera factura después del pago
```

### **Escenario 3: Cliente Recoge en Tienda (Pickup)**
```
OPCIÓN A: Paga antes de recoger
1. Cliente hace pedido → Estado: PENDIENTE, metodo_pago: "RECOGER_EN_TIENDA"
2. Cliente paga (online/transferencia) → Estado: PAGADO
3. Se genera factura
4. Se prepara pedido → Estado: PREPARANDO
5. Se marca como listo → Estado: LISTO_PARA_RECOGER
6. Cliente va a tienda y recoge → Estado: ENTREGADO
   → persona_recibe: nombre del cliente
   → fecha_entrega: ahora
   → observaciones: "Recogido en tienda"

OPCIÓN B: Paga al recoger
1. Cliente hace pedido → Estado: PENDIENTE, metodo_pago: "RECOGER_EN_TIENDA"
2. Se prepara pedido → Estado: PREPARANDO
3. Se marca como listo → Estado: LISTO_PARA_RECOGER
4. Cliente va a tienda:
   a. Paga en efectivo/tarjeta → Se crea pago_cliente
   b. Se genera factura
   c. Cliente recoge → Estado: ENTREGADO
   → persona_recibe: nombre del cliente
   → fecha_entrega: ahora
   → observaciones: "Recogido en tienda, pagado en efectivo"
```

---

## 📊 Estados Actuales vs Necesarios

### **Estados Actuales (Básicos)**
- `PENDIENTE` - Pedido creado, esperando pago
- `PAGADO` - Pago recibido
- `ENVIADO` - Enviado al cliente
- `ENTREGADO` - Cliente recibió
- `CANCELADO` - Pedido cancelado

### **Estados que Faltan (Para ser más realista)**
- `PREPARANDO` - Preparando pedido en almacén
- `EN_ENVIO` - En camino al cliente
- `LISTO_PARA_RECOGER` - Pedido listo para que cliente lo recoja en tienda
- `PENDIENTE_PAGO` - Esperando pago (para contra entrega o recoger en tienda)
- `PARCIALMENTE_ENTREGADO` - Si se entrega en partes

---

## 🔍 Problemas Actuales

### ❌ **Lo que NO tenemos:**
1. **No hay tabla de envíos** - No sabemos quién entregó, cuándo, a quién
2. **No hay fechas de eventos** - Solo fecha de creación, no fecha de pago, envío, entrega
3. **No hay información de entrega** - Quién recibió, firma, foto, etc.
4. **No hay método de pago en la orden** - No sabemos si es contra entrega o prepago
5. **No hay rastreo de repartidor** - Quién hizo la entrega

---

## ✅ **Solución Propuesta: Mejorar el Modelo**

### **Opción 1: Agregar campos a OrdenVenta (Simple)**
```python
class OrdenVenta(Base):
    # ... campos existentes ...
    
    # Método de pago
    metodo_pago: Mapped[str] = mapped_column(String(50), nullable=True)  
    # PREPAGO, CONTRA_ENTREGA, CREDITO
    
    # Fechas de eventos
    fecha_pago: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_preparacion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_envio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    fecha_entrega: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Información de entrega
    direccion_entrega: Mapped[str | None] = mapped_column(String(255), nullable=True)
    persona_recibe: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Nombre de quien recibió
    repartidor_id: Mapped[int | None] = mapped_column(ForeignKey("dbo.usuarios.id"), nullable=True)
    observaciones_entrega: Mapped[str | None] = mapped_column(Text, nullable=True)
```

### **Opción 2: Crear tabla de Envíos (Más completo)**
```python
class Envio(Base):
    __tablename__ = "envios"
    
    id: Mapped[int]
    orden_venta_id: Mapped[int]
    factura_id: Mapped[int | None]
    
    # Estado del envío
    estado: Mapped[str]  # PREPARANDO, EN_CAMINO, ENTREGADO, DEVUELTO
    
    # Fechas
    fecha_salida: Mapped[datetime | None]
    fecha_entrega: Mapped[datetime | None]
    
    # Información de entrega
    direccion_entrega: Mapped[str]
    persona_recibe: Mapped[str | None]
    repartidor_id: Mapped[int | None]
    observaciones: Mapped[str | None]
    
    # Pago contra entrega
    monto_cobrado: Mapped[float | None]
    metodo_pago_entrega: Mapped[str | None]  # EFECTIVO, TARJETA
```

---

## 💡 **Recomendación: Opción 1 (Simple pero efectiva)**

Para una ferretería, la **Opción 1 es suficiente** porque:
- ✅ Más simple de implementar
- ✅ No necesitas rastreo complejo de envíos
- ✅ Toda la información está en un solo lugar
- ✅ Fácil de consultar y reportar

La **Opción 2** solo sería necesaria si:
- Tienes múltiples entregas por pedido
- Necesitas rastreo GPS
- Tienes muchos repartidores
- Necesitas historial detallado de intentos de entrega

---

## 🔄 **Flujo Completo Propuesto**

### **Caso 1: Pago Anticipado**
```
1. Cliente crea pedido
   → estado: "PENDIENTE"
   → metodo_pago: "PREPAGO"
   → fecha: ahora

2. Cliente paga (transferencia/efectivo)
   → Se crea registro en pagos_cliente
   → estado: "PAGADO"
   → fecha_pago: ahora
   → Se genera factura automáticamente

3. Empleado prepara pedido
   → estado: "PREPARANDO"
   → fecha_preparacion: ahora

4. Empleado marca como enviado
   → estado: "ENVIADO" o "EN_ENVIO"
   → fecha_envio: ahora
   → repartidor_id: usuario que envía

5. Repartidor entrega
   → estado: "ENTREGADO"
   → fecha_entrega: ahora
   → persona_recibe: "Juan Pérez"
   → observaciones_entrega: "Entregado en puerta principal"
```

### **Caso 2: Pago Contra Entrega**
```
1. Cliente crea pedido
   → estado: "PENDIENTE"
   → metodo_pago: "CONTRA_ENTREGA"
   → fecha: ahora

2. Empleado prepara pedido
   → estado: "PREPARANDO"
   → fecha_preparacion: ahora

3. Empleado marca como enviado
   → estado: "EN_ENVIO"
   → fecha_envio: ahora
   → repartidor_id: usuario que envía

4. Repartidor entrega y cobra
   → estado: "ENTREGADO"
   → fecha_entrega: ahora
   → persona_recibe: "María González"
   → Se crea registro en pagos_cliente:
     - monto: total del pedido
     - metodo_pago: "EFECTIVO"
     - fecha_pago: ahora
     - orden_venta_id: id del pedido
   → Se genera factura después del pago
```

### **Caso 3: Recoger en Tienda (Pickup) - Paga Antes**
```
1. Cliente crea pedido
   → estado: "PENDIENTE"
   → metodo_pago: "RECOGER_EN_TIENDA"
   → fecha: ahora

2. Cliente paga (transferencia/online)
   → Se crea registro en pagos_cliente
   → estado: "PAGADO"
   → fecha_pago: ahora
   → Se genera factura automáticamente

3. Empleado prepara pedido
   → estado: "PREPARANDO"
   → fecha_preparacion: ahora

4. Empleado marca como listo
   → estado: "LISTO_PARA_RECOGER"
   → (notificar al cliente que puede recoger)

5. Cliente va a tienda y recoge
   → estado: "ENTREGADO"
   → fecha_entrega: ahora
   → persona_recibe: nombre del cliente
   → observaciones_entrega: "Recogido en tienda"
```

### **Caso 4: Recoger en Tienda (Pickup) - Paga al Recoger**
```
1. Cliente crea pedido
   → estado: "PENDIENTE"
   → metodo_pago: "RECOGER_EN_TIENDA"
   → fecha: ahora

2. Empleado prepara pedido
   → estado: "PREPARANDO"
   → fecha_preparacion: ahora

3. Empleado marca como listo
   → estado: "LISTO_PARA_RECOGER"
   → (notificar al cliente que puede recoger)

4. Cliente va a tienda:
   a. Paga en efectivo/tarjeta
   b. Se crea registro en pagos_cliente:
      - monto: total del pedido
      - metodo_pago: "EFECTIVO" o "TARJETA"
      - fecha_pago: ahora
      - orden_venta_id: id del pedido
   c. Se genera factura
   d. Cliente recoge
   → estado: "ENTREGADO"
   → fecha_entrega: ahora
   → persona_recibe: nombre del cliente
   → observaciones_entrega: "Recogido en tienda, pagado en efectivo"
```

---

## 📋 **Campos Necesarios en OrdenVenta**

```python
# Método de pago original
metodo_pago: "PREPAGO" | "CONTRA_ENTREGA" | "RECOGER_EN_TIENDA" | "CREDITO"

# Fechas de eventos
fecha_pago: datetime | None
fecha_preparacion: datetime | None
fecha_envio: datetime | None
fecha_entrega: datetime | None

# Información de entrega/recogida
direccion_entrega: str | None  # Solo si es envío a domicilio
persona_recibe: str | None  # Quién recibió (cliente o persona autorizada)
repartidor_id: int | None  # FK a usuarios (empleado que entregó/atendió)
sucursal_recogida_id: int | None  # FK a sucursales (si recogió en tienda)
observaciones_entrega: str | None
```

---

## 🎯 **Endpoints Necesarios**

```
PATCH /api/v1/sales/{id}/status
  Body: { "estado": "PREPARANDO" }
  → Actualiza estado y fecha_preparacion

PATCH /api/v1/sales/{id}/ship
  Body: { 
    "repartidor_id": 5,
    "direccion_entrega": "Calle Principal 123"
  }
  → Estado: EN_ENVIO, fecha_envio: ahora

PATCH /api/v1/sales/{id}/deliver
  Body: {
    "persona_recibe": "Juan Pérez",
    "observaciones": "Entregado en puerta",
    "pago_contra_entrega": {  // Solo si metodo_pago original era CONTRA_ENTREGA
      "monto": 500.00,
      "metodo_pago": "EFECTIVO"
    }
  }
  → Estado: ENTREGADO
  → Si es contra entrega, crea pago y factura

PATCH /api/v1/sales/{id}/ready-for-pickup
  Body: {}
  → Estado: LISTO_PARA_RECOGER
  → (Notificar al cliente)

PATCH /api/v1/sales/{id}/pickup
  Body: {
    "persona_recibe": "María González",
    "pago_al_recoger": {  // Solo si no pagó antes
      "monto": 300.00,
      "metodo_pago": "EFECTIVO"
    },
    "observaciones": "Recogido en tienda"
  }
  → Estado: ENTREGADO
  → Si no pagó antes, crea pago y factura
```

---

## ✅ **Conclusión**

**Para una ferretería realista, necesitas:**

1. ✅ **Método de pago en la orden** - Saber si es prepago, contra entrega, o recoger en tienda
2. ✅ **Fechas de eventos** - Cuándo se pagó, preparó, envió, entregó
3. ✅ **Información de entrega/recogida** - Quién recibió, quién entregó/atendió, observaciones
4. ✅ **Estado LISTO_PARA_RECOGER** - Para pedidos que se recogen en tienda
5. ✅ **Actualización de estados** - Endpoints para cambiar estados
6. ✅ **Pago contra entrega** - Crear pago cuando se entrega
7. ✅ **Pago al recoger** - Crear pago cuando cliente recoge en tienda

**¿Quieres que implemente esto ahora?**

