# Análisis de Tablas No Utilizadas

## Resumen
- **Total de tablas en BD**: 78 tablas
- **Tablas con modelos ORM**: ~35 tablas
- **Tablas en uso activo**: ~29 tablas
- **Tablas NO utilizadas**: ~49 tablas (63%)

---

## Tablas que SÍ estamos usando (29 tablas)

### Autenticación y Usuarios
1. ✅ `usuarios` - Gestión de usuarios
2. ✅ `roles` - Roles del sistema
3. ✅ `permisos` - Permisos (definido pero uso limitado)
4. ✅ `usuarios_roles` - Relación usuarios-roles
5. ✅ `roles_permisos` - Relación roles-permisos
6. ✅ `idempotency_keys` - Idempotencia (creada por migración)

### Clientes y Proveedores
7. ✅ `clientes` - Gestión de clientes
8. ✅ `proveedores` - Gestión de proveedores

### Productos
9. ✅ `productos` - Productos principales
10. ✅ `variantes_producto` - Variantes de productos
11. ✅ `categorias` - Categorías de productos
12. ✅ `marcas` - Marcas de productos
13. ✅ `unidades_medida` - Unidades de medida
14. ✅ `imagenes_producto` - Imágenes de productos

### Ventas y Compras
15. ✅ `ordenes_venta` - Órdenes de venta
16. ✅ `items_orden_venta` - Items de órdenes de venta
17. ✅ `ordenes_compra` - Órdenes de compra
18. ✅ `items_orden_compra` - Items de órdenes de compra

### Reservas y Promociones
19. ✅ `reservas` - Reservas de productos
20. ✅ `items_reserva` - Items de reservas
21. ✅ `promociones` - Promociones
22. ✅ `reglas_promocion` - Reglas de promociones

### Inventario
23. ✅ `almacenes` - Almacenes
24. ✅ `producto_almacen` - Stock por almacén
25. ✅ `libro_stock` - Libro de movimientos de stock
26. ✅ `ajustes_stock` - Ajustes de inventario
27. ✅ `items_ajuste_stock` - Items de ajustes
28. ✅ `transferencias_stock` - Transferencias entre almacenes
29. ✅ `items_transferencia_stock` - Items de transferencias

---

## Tablas que NO estamos usando (49 tablas)

### 1. Auditoría y Seguridad (4 tablas)
- ❌ `bitacora_auditoria` - **Razón**: No implementamos auditoría de cambios
- ❌ `historial_contrasenas` - **Razón**: No implementamos historial de contraseñas
- ❌ `credenciales_biometricas` - **Razón**: No implementamos autenticación biométrica
- ❌ `metodos_mfa` - **Razón**: No implementamos autenticación de dos factores (MFA)

### 2. Contactos y Direcciones (3 tablas)
- ❌ `contactos` - **Razón**: No gestionamos contactos separados de clientes/proveedores
- ❌ `contactos_proveedor` - **Razón**: Los proveedores tienen contacto directo, no contactos adicionales
- ❌ `direcciones` - **Razón**: Las direcciones están en clientes/proveedores directamente

### 3. Empresas y Sucursales (2 tablas)
- ❌ `empresas` - **Razón**: Modelo definido pero no hay endpoints/servicios
- ❌ `sucursales` - **Razón**: Modelo definido pero no hay endpoints/servicios
- ❌ `horarios_sucursal` - **Razón**: No gestionamos horarios de sucursales

### 4. Facturación (4 tablas)
- ❌ `facturas_venta` - **Razón**: Solo tenemos órdenes de venta, no facturas separadas
- ❌ `items_factura_venta` - **Razón**: No hay facturas, solo órdenes
- ❌ `facturas_proveedor` - **Razón**: No gestionamos facturas de proveedores
- ❌ `items_factura_proveedor` - **Razón**: No hay facturas de proveedores

### 5. Pagos (2 tablas)
- ❌ `pagos_cliente` - **Razón**: No gestionamos pagos separados de órdenes
- ❌ `pagos_proveedor` - **Razón**: No gestionamos pagos a proveedores

### 6. Envíos y Logística (2 tablas)
- ❌ `envios` - **Razón**: No gestionamos envíos separados
- ❌ `items_envio` - **Razón**: No hay gestión de envíos

### 7. Recepción de Mercancía (2 tablas)
- ❌ `recepciones_mercancia` - **Razón**: No gestionamos recepciones separadas de órdenes de compra
- ❌ `items_recepcion_mercancia` - **Razón**: No hay recepciones separadas

### 8. Inventario Avanzado (4 tablas)
- ❌ `conteos_ciclicos` - **Razón**: No implementamos conteos cíclicos de inventario
- ❌ `items_conteo_ciclico` - **Razón**: No hay conteos cíclicos
- ❌ `ubicaciones_bin` - **Razón**: No gestionamos ubicaciones específicas en almacenes
- ❌ `lotes` - **Razón**: No gestionamos lotes de productos

### 9. Precios y Listas (3 tablas)
- ❌ `listas_precios` - **Razón**: No gestionamos listas de precios diferentes
- ❌ `items_lista_precios` - **Razón**: No hay listas de precios
- ❌ `lotes_ajuste_precios` - **Razón**: No ajustamos precios por lotes

### 10. Garantías y Servicios (1 tabla)
- ❌ `garantias` - **Razón**: No gestionamos garantías de productos

### 11. Gastos (1 tabla)
- ❌ `gastos` - **Razón**: No gestionamos gastos operativos

### 12. Fidelización (2 tablas)
- ❌ `programas_fidelidad` - **Razón**: No implementamos programas de fidelización
- ❌ `puntos_fidelidad` - **Razón**: No gestionamos puntos de fidelidad

### 13. Notificaciones (2 tablas)
- ❌ `notificaciones` - **Razón**: No implementamos sistema de notificaciones
- ❌ `plantillas_notificaciones` - **Razón**: No hay plantillas de notificaciones

### 14. Métodos de Pago (1 tabla)
- ❌ `metodos_pago` - **Razón**: No gestionamos métodos de pago separados

### 15. Autenticación Externa (2 tablas)
- ❌ `cuentas_auth_usuarios` - **Razón**: No implementamos autenticación con proveedores externos (Google, Facebook)
- ❌ `proveedores_autenticacion` - **Razón**: No hay proveedores de autenticación externa

### 16. API y Seguridad (1 tabla)
- ❌ `llaves_api` - **Razón**: No gestionamos API keys separadas

### 17. Números de Serie (1 tabla)
- ❌ `numeros_serie` - **Razón**: No gestionamos números de serie de productos

### 18. Períodos Fiscales (1 tabla)
- ❌ `periodos_fiscales` - **Razón**: No gestionamos períodos fiscales

### 19. Líneas Financieras (1 tabla)
- ❌ `lineas_financieras` - **Razón**: No gestionamos líneas de crédito financieras

### 20. Producto-Proveedor (1 tabla)
- ❌ `producto_proveedor` - **Razón**: No gestionamos relación directa producto-proveedor (solo en órdenes de compra)

### 21. Reglas de Reposición (1 tabla)
- ❌ `reglas_reposicion` - **Razón**: No implementamos reglas automáticas de reposición de stock

### 22. Cierre de Categorías (1 tabla)
- ❌ `cierre_categoria` - **Razón**: Modelo definido pero no implementamos jerarquías de categorías

### 23. Atributos de Productos (3 tablas)
- ❌ `atributos` - **Razón**: Modelo definido pero no implementamos atributos personalizados
- ❌ `valores_atributos` - **Razón**: No hay valores de atributos
- ❌ `valores_atributo_variante` - **Razón**: No hay atributos en variantes

### 24. Chatbot e IA (3 tablas)
- ❌ `intenciones_chatbot` - **Razón**: No implementamos chatbot
- ❌ `mensajes_chatbot` - **Razón**: No hay chatbot
- ❌ `registros_entrenamiento_ai` - **Razón**: No implementamos entrenamiento de IA
- ❌ `sugerencias_reposicion_ai` - **Razón**: No hay sugerencias de reposición con IA

---

## Recomendaciones

### Opción 1: Eliminar tablas no usadas
Si estas funcionalidades no se van a implementar, se pueden eliminar para simplificar la base de datos.

### Opción 2: Implementar funcionalidades críticas
Algunas tablas podrían ser útiles:
- **Facturación**: `facturas_venta`, `facturas_proveedor` (si necesitas facturación separada)
- **Pagos**: `pagos_cliente`, `pagos_proveedor` (si necesitas gestión de pagos)
- **Envíos**: `envios` (si necesitas tracking de envíos)
- **Auditoría**: `bitacora_auditoria` (para cumplimiento y trazabilidad)

### Opción 3: Mantener para futuro
Si planeas implementar estas funcionalidades, mantener las tablas pero documentar que no están en uso actualmente.

---

## Estadísticas Finales

- **Tablas en uso**: 29 (37%)
- **Tablas no usadas**: 49 (63%)
- **Tablas con modelo pero sin uso**: 6 (8%)

