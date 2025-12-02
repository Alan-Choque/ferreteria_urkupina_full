# Análisis de Optimización de Base de Datos

## 📊 Estado Actual
- **Total de tablas**: 78 tablas
- **Tablas usadas**: ~37 tablas
- **Tablas no usadas**: ~41 tablas

## 🗑️ Tablas a Eliminar (No se usan en el código)

### 1. Contactos y Direcciones
- `contactos` - No se usa
- `contactos_proveedor` - No se usa
- `direcciones` - No se usa (los clientes tienen dirección directa)

### 2. Facturación (No usamos facturas separadas)
- `facturas_venta` - Las órdenes de venta ya son facturas
- `items_factura_venta` - Los items_orden_venta ya son los items
- `facturas_proveedor` - No se usa
- `items_factura_proveedor` - No se usa

### 3. Pagos (No gestionamos pagos separados)
- `pagos_cliente` - No se usa
- `pagos_proveedor` - No se usa

### 4. Envíos (No gestionamos envíos separados)
- `envios` - No se usa
- `items_envio` - No se usa

### 5. Recepción de Mercancía
- `recepciones_mercancia` - No se usa
- `items_recepcion_mercancia` - No se usa

### 6. Inventario Avanzado (No implementado)
- `conteos_ciclicos` - No se usa
- `items_conteo_ciclico` - No se usa
- `ubicaciones_bin` - No se usa
- `lotes` - No se usa

### 7. Precios y Listas (No implementado)
- `listas_precios` - No se usa
- `items_lista_precios` - No se usa
- `lotes_ajuste_precios` - No se usa

### 8. Garantías y Servicios
- `garantias` - No se usa

### 9. Gastos
- `gastos` - No se usa

### 10. Fidelización (No implementado)
- `programas_fidelidad` - No se usa
- `puntos_fidelidad` - No se usa

### 11. Notificaciones (No implementado)
- `notificaciones` - No se usa
- `plantillas_notificaciones` - No se usa

### 12. Métodos de Pago
- `metodos_pago` - No se usa

### 13. Autenticación Externa (No implementado)
- `cuentas_auth_usuarios` - No se usa
- `proveedores_autenticacion` - No se usa

### 14. API Keys
- `llaves_api` - No se usa

### 15. Números de Serie
- `numeros_serie` - No se usa

### 16. Períodos Fiscales
- `periodos_fiscales` - No se usa

### 17. Líneas Financieras
- `lineas_financieras` - No se usa

### 18. Producto-Proveedor
- `producto_proveedor` - No se usa (relación directa en compras)

### 19. Reglas de Reposición
- `reglas_reposicion` - No se usa

### 20. Cierre de Categorías (No implementado)
- `cierre_categoria` - Está en modelo pero no se usa

### 21. Chatbot e IA (No implementado)
- `intenciones_chatbot` - No se usa
- `mensajes_chatbot` - No se usa
- `registros_entrenamiento_ai` - No se usa
- `sugerencias_reposicion_ai` - No se usa

### 22. Horarios de Sucursal
- `horarios_sucursal` - No se usa

## ✅ Tablas que se MANTIENEN (Se usan o son importantes)

### Tablas de Auditoría y Seguridad (Como solicitaste)
- `bitacora_auditoria` ✅
- `historial_contrasenas` ✅
- `credenciales_biometricas` ✅
- `metodos_mfa` ✅

### Tablas Activas
- `usuarios`, `roles`, `permisos`, `usuarios_roles`, `roles_permisos` ✅
- `clientes` ✅
- `productos`, `variantes_producto`, `imagenes_producto` ✅
- `categorias`, `marcas`, `unidades_medida` ✅
- `ordenes_venta`, `items_orden_venta` ✅
- `ordenes_compra`, `items_orden_compra` ✅
- `reservas`, `items_reserva` ✅
- `proveedores` ✅
- `almacenes`, `sucursales`, `empresas` ✅ (Se usan en inventario)
- `producto_almacen` ✅
- `promociones`, `reglas_promocion` ✅
- `atributos`, `valores_atributos`, `valores_atributo_variante` ✅ (Están en modelo ORM)
- `libro_stock`, `ajustes_stock`, `items_ajuste_stock` ✅
- `transferencias_stock`, `items_transferencia_stock` ✅
- `idempotency_keys` ✅

## 🔄 Tablas que Podrían Unirse/Simplificarse (Opcional)

### Opción 1: Simplificar Empresa-Sucursal-Almacen
**Situación actual**: Empresa → Sucursal → Almacen (3 niveles)

**Si solo tienes 1 empresa**:
- Podrías eliminar `empresas` y poner `empresa_id` directamente en `sucursales` como constante
- O eliminar `sucursales` si solo hay 1 sucursal y poner `sucursal_id` en `almacenes` como constante

**Recomendación**: Mantener la estructura actual si planeas tener múltiples empresas/sucursales en el futuro.

### Opción 2: Eliminar CierreCategoria
- Está en el modelo pero no se usa
- Se puede eliminar sin problemas

### Opción 3: Atributos (Preguntar)
- `atributos`, `valores_atributos`, `valores_atributo_variante` están en el modelo ORM
- No se usan activamente en servicios
- **Pregunta**: ¿Planeas usar atributos de productos en el futuro? Si no, se pueden eliminar.

## 📈 Beneficios de Eliminar Tablas

1. **Menos complejidad**: Base de datos más simple de mantener
2. **Mejor rendimiento**: Menos tablas = menos overhead
3. **Backups más rápidos**: Menos datos que respaldar
4. **Menos confusión**: Solo tablas que realmente se usan

## ⚠️ Advertencias

- **Backup obligatorio**: Hacer backup completo antes de ejecutar
- **Irreversible**: No se puede revertir fácilmente (necesitarías backup)
- **Dependencias**: Verificar que no haya foreign keys que dependan de estas tablas


