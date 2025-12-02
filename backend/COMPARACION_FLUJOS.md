# 🔄 Comparación de Flujos de Pago y Entrega

## 📊 Resumen de los 3 Flujos Principales

| Aspecto | Prepago | Contra Entrega | Recoger en Tienda |
|---------|---------|----------------|-------------------|
| **Cuándo se paga** | Antes de preparar | Al entregar | Antes o al recoger |
| **Cuándo se factura** | Inmediatamente | Después de entregar | Inmediatamente o al recoger |
| **Estado inicial** | PENDIENTE | PENDIENTE | PENDIENTE |
| **Después de pago** | PAGADO → PREPARANDO | (sin pago) → PREPARANDO | PAGADO o PREPARANDO |
| **Estado intermedio** | ENVIADO/EN_ENVIO | EN_ENVIO | LISTO_PARA_RECOGER |
| **Estado final** | ENTREGADO | ENTREGADO + Pago | ENTREGADO |
| **Quién entrega** | Repartidor | Repartidor | Cliente mismo |
| **Información necesaria** | Dirección de envío | Dirección + Quién recibe | Sucursal donde recoge |

---

## 🎯 Flujo Detallado: Recoger en Tienda

### **Variante A: Cliente Paga Antes (Online/Transferencia)**

```
┌─────────────────────────────────────────────────────────┐
│ 1. CLIENTE CREA PEDIDO                                  │
│    - estado: "PENDIENTE"                                │
│    - metodo_pago: "RECOGER_EN_TIENDA"                   │
│    - fecha: ahora                                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CLIENTE PAGA (Online/Transferencia)                  │
│    - Se crea: pagos_cliente                             │
│    - estado: "PAGADO"                                    │
│    - fecha_pago: ahora                                   │
│    - Se genera: factura_venta automáticamente           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. EMPLEADO PREPARA PEDIDO                               │
│    - estado: "PREPARANDO"                                │
│    - fecha_preparacion: ahora                            │
│    - usuario_id: empleado que prepara                    │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. EMPLEADO MARCA COMO LISTO                            │
│    - estado: "LISTO_PARA_RECOGER"                        │
│    - (Sistema notifica al cliente: "Tu pedido está listo")│
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. CLIENTE VA A TIENDA Y RECOGE                         │
│    - estado: "ENTREGADO"                                 │
│    - fecha_entrega: ahora                                │
│    - persona_recibe: nombre del cliente                  │
│    - repartidor_id: empleado que atendió                 │
│    - sucursal_recogida_id: sucursal donde recogió        │
│    - observaciones: "Recogido en tienda"                 │
└─────────────────────────────────────────────────────────┘
```

### **Variante B: Cliente Paga al Recoger**

```
┌─────────────────────────────────────────────────────────┐
│ 1. CLIENTE CREA PEDIDO                                  │
│    - estado: "PENDIENTE"                                │
│    - metodo_pago: "RECOGER_EN_TIENDA"                   │
│    - fecha: ahora                                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. EMPLEADO PREPARA PEDIDO                              │
│    - estado: "PREPARANDO"                                │
│    - fecha_preparacion: ahora                            │
│    - (NO hay pago aún)                                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. EMPLEADO MARCA COMO LISTO                            │
│    - estado: "LISTO_PARA_RECOGER"                        │
│    - (Sistema notifica al cliente: "Tu pedido está listo")│
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. CLIENTE VA A TIENDA                                  │
│    a) PAGA (efectivo/tarjeta)                           │
│       - Se crea: pagos_cliente                           │
│       - monto: total del pedido                         │
│       - metodo_pago: "EFECTIVO" o "TARJETA"             │
│       - fecha_pago: ahora                                │
│    b) Se genera: factura_venta                          │
│    c) CLIENTE RECOGE                                    │
│       - estado: "ENTREGADO"                              │
│       - fecha_entrega: ahora                             │
│       - persona_recibe: nombre del cliente               │
│       - repartidor_id: empleado que atendió              │
│       - sucursal_recogida_id: sucursal donde recogió     │
│       - observaciones: "Recogido en tienda, pagado en efectivo"│
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Diferencias Clave

### **Recoger en Tienda vs Contra Entrega**

| Aspecto | Recoger en Tienda | Contra Entrega |
|---------|-------------------|----------------|
| **Lugar de pago** | En la tienda | En el domicilio del cliente |
| **Quién va** | Cliente va a tienda | Repartidor va al cliente |
| **Estado intermedio** | LISTO_PARA_RECOGER | EN_ENVIO |
| **Información necesaria** | Sucursal donde recoge | Dirección de entrega |
| **Costo de envío** | No hay (cliente recoge) | Hay (repartidor lleva) |

### **Recoger en Tienda vs Prepago con Envío**

| Aspecto | Recoger en Tienda | Prepago con Envío |
|---------|-------------------|-------------------|
| **Lugar de entrega** | Tienda | Domicilio del cliente |
| **Estado intermedio** | LISTO_PARA_RECOGER | EN_ENVIO |
| **Costo de envío** | No hay | Hay |
| **Conveniencia** | Cliente debe ir | Llega a domicilio |

---

## 💡 Ventajas de Cada Método

### **Recoger en Tienda:**
✅ Sin costo de envío  
✅ Cliente puede ver productos antes de llevarlos  
✅ Pago seguro en tienda  
✅ Menos riesgo de pérdida/daño en transporte  

### **Contra Entrega:**
✅ Cliente no necesita ir a tienda  
✅ Pago seguro al recibir  
✅ Ver productos antes de pagar  

### **Prepago:**
✅ Cliente no necesita ir a tienda  
✅ Entrega más rápida (ya está pagado)  
✅ Menos riesgo para el negocio  

---

## 📋 Campos Necesarios en OrdenVenta

```python
# Método de pago/entrega
metodo_pago: "PREPAGO" | "CONTRA_ENTREGA" | "RECOGER_EN_TIENDA" | "CREDITO"

# Fechas de eventos
fecha_pago: datetime | None
fecha_preparacion: datetime | None
fecha_envio: datetime | None  # Solo si es envío a domicilio
fecha_entrega: datetime | None

# Información de entrega/recogida
direccion_entrega: str | None  # Solo si es envío
sucursal_recogida_id: int | None  # Solo si recoge en tienda
persona_recibe: str | None
repartidor_id: int | None  # Empleado que entregó/atendió
observaciones_entrega: str | None
```

---

## ✅ Conclusión

**Para una ferretería, necesitas soportar los 3 métodos:**
1. **Prepago** - Para clientes que confían y quieren entrega rápida
2. **Contra Entrega** - Para clientes que quieren ver antes de pagar
3. **Recoger en Tienda** - Para clientes cercanos que prefieren recoger

**Todos comparten la misma estructura base, solo cambia:**
- Cuándo se paga
- Dónde se entrega
- Estado intermedio (EN_ENVIO vs LISTO_PARA_RECOGER)

