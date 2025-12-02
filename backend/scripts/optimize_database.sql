-- ============================================
-- SCRIPT DE OPTIMIZACIÓN Y LIMPIEZA DE BD
-- Ferretería Urkupina
-- ============================================
-- ⚠️ HACER BACKUP COMPLETO ANTES DE EJECUTAR
-- ⚠️ Ejecutar en horario de bajo tráfico
-- ⚠️ Este script NO cambia la funcionalidad, solo optimiza
-- ============================================

SET NOCOUNT ON;
GO

PRINT '========================================';
PRINT 'INICIANDO OPTIMIZACIÓN DE BASE DE DATOS';
PRINT '========================================';
PRINT '';

BEGIN TRANSACTION;

-- ============================================
-- PARTE 1: ELIMINAR TABLAS NO UTILIZADAS
-- ============================================
PRINT 'PARTE 1: Eliminando tablas no utilizadas...';
PRINT '';

-- NOTA: Tablas de auditoría y seguridad se MANTIENEN (no se eliminan)
-- - bitacora_auditoria
-- - historial_contrasenas
-- - credenciales_biometricas
-- - metodos_mfa
PRINT '  ℹ Tablas de auditoría y seguridad se mantienen (no se eliminan)';

-- Eliminar tablas de contactos y direcciones
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'contactos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.contactos;
    PRINT '  ✓ Eliminada: contactos';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'contactos_proveedor' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.contactos_proveedor;
    PRINT '  ✓ Eliminada: contactos_proveedor';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'direcciones' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.direcciones;
    PRINT '  ✓ Eliminada: direcciones';
END

-- Eliminar tablas de empresas y sucursales (no implementadas)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'horarios_sucursal' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.horarios_sucursal;
    PRINT '  ✓ Eliminada: horarios_sucursal';
END

-- Eliminar tablas de facturación (no usamos facturas separadas)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'facturas_venta' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.facturas_venta;
    PRINT '  ✓ Eliminada: facturas_venta';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items_factura_venta' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.items_factura_venta;
    PRINT '  ✓ Eliminada: items_factura_venta';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'facturas_proveedor' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.facturas_proveedor;
    PRINT '  ✓ Eliminada: facturas_proveedor';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items_factura_proveedor' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.items_factura_proveedor;
    PRINT '  ✓ Eliminada: items_factura_proveedor';
END

-- Eliminar tablas de pagos (no gestionamos pagos separados)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pagos_cliente' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.pagos_cliente;
    PRINT '  ✓ Eliminada: pagos_cliente';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'pagos_proveedor' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.pagos_proveedor;
    PRINT '  ✓ Eliminada: pagos_proveedor';
END

-- Eliminar tablas de envíos (no gestionamos envíos separados)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'envios' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.envios;
    PRINT '  ✓ Eliminada: envios';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items_envio' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.items_envio;
    PRINT '  ✓ Eliminada: items_envio';
END

-- Eliminar tablas de recepción de mercancía
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'recepciones_mercancia' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.recepciones_mercancia;
    PRINT '  ✓ Eliminada: recepciones_mercancia';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items_recepcion_mercancia' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.items_recepcion_mercancia;
    PRINT '  ✓ Eliminada: items_recepcion_mercancia';
END

-- Eliminar tablas de inventario avanzado
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'conteos_ciclicos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.conteos_ciclicos;
    PRINT '  ✓ Eliminada: conteos_ciclicos';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items_conteo_ciclico' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.items_conteo_ciclico;
    PRINT '  ✓ Eliminada: items_conteo_ciclico';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ubicaciones_bin' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.ubicaciones_bin;
    PRINT '  ✓ Eliminada: ubicaciones_bin';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'lotes' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.lotes;
    PRINT '  ✓ Eliminada: lotes';
END

-- Eliminar tablas de precios y listas
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'listas_precios' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.listas_precios;
    PRINT '  ✓ Eliminada: listas_precios';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items_lista_precios' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.items_lista_precios;
    PRINT '  ✓ Eliminada: items_lista_precios';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'lotes_ajuste_precios' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.lotes_ajuste_precios;
    PRINT '  ✓ Eliminada: lotes_ajuste_precios';
END

-- Eliminar tablas de garantías y servicios
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'garantias' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.garantias;
    PRINT '  ✓ Eliminada: garantias';
END

-- Eliminar tablas de gastos
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'gastos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.gastos;
    PRINT '  ✓ Eliminada: gastos';
END

-- Eliminar tablas de fidelización
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'programas_fidelidad' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.programas_fidelidad;
    PRINT '  ✓ Eliminada: programas_fidelidad';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'puntos_fidelidad' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.puntos_fidelidad;
    PRINT '  ✓ Eliminada: puntos_fidelidad';
END

-- Eliminar tablas de notificaciones
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'notificaciones' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.notificaciones;
    PRINT '  ✓ Eliminada: notificaciones';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'plantillas_notificaciones' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.plantillas_notificaciones;
    PRINT '  ✓ Eliminada: plantillas_notificaciones';
END

-- Eliminar tablas de métodos de pago
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'metodos_pago' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.metodos_pago;
    PRINT '  ✓ Eliminada: metodos_pago';
END

-- Eliminar tablas de autenticación externa
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'cuentas_auth_usuarios' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.cuentas_auth_usuarios;
    PRINT '  ✓ Eliminada: cuentas_auth_usuarios';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'proveedores_autenticacion' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.proveedores_autenticacion;
    PRINT '  ✓ Eliminada: proveedores_autenticacion';
END

-- Eliminar tablas de API
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'llaves_api' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.llaves_api;
    PRINT '  ✓ Eliminada: llaves_api';
END

-- Eliminar tablas de números de serie
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'numeros_serie' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.numeros_serie;
    PRINT '  ✓ Eliminada: numeros_serie';
END

-- Eliminar tablas de períodos fiscales
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'periodos_fiscales' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.periodos_fiscales;
    PRINT '  ✓ Eliminada: periodos_fiscales';
END

-- Eliminar tablas de líneas financieras
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'lineas_financieras' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.lineas_financieras;
    PRINT '  ✓ Eliminada: lineas_financieras';
END

-- Eliminar tablas de producto-proveedor
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'producto_proveedor' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.producto_proveedor;
    PRINT '  ✓ Eliminada: producto_proveedor';
END

-- Eliminar tablas de reglas de reposición
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'reglas_reposicion' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.reglas_reposicion;
    PRINT '  ✓ Eliminada: reglas_reposicion';
END

-- Eliminar tablas de cierre de categorías (no implementado)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'cierre_categoria' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.cierre_categoria;
    PRINT '  ✓ Eliminada: cierre_categoria';
END

-- Eliminar tablas de atributos (no implementado activamente)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'atributos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.atributos;
    PRINT '  ✓ Eliminada: atributos';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'valores_atributos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.valores_atributos;
    PRINT '  ✓ Eliminada: valores_atributos';
END

-- NOTA: NO eliminamos 'valores_atributo_variante' porque está en el modelo ORM
-- aunque no se use activamente, podría causar problemas si se elimina

-- Eliminar tablas de chatbot e IA
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'intenciones_chatbot' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.intenciones_chatbot;
    PRINT '  ✓ Eliminada: intenciones_chatbot';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'mensajes_chatbot' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.mensajes_chatbot;
    PRINT '  ✓ Eliminada: mensajes_chatbot';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'registros_entrenamiento_ai' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.registros_entrenamiento_ai;
    PRINT '  ✓ Eliminada: registros_entrenamiento_ai';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'sugerencias_reposicion_ai' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DROP TABLE dbo.sugerencias_reposicion_ai;
    PRINT '  ✓ Eliminada: sugerencias_reposicion_ai';
END

PRINT '';
PRINT 'PARTE 1 COMPLETADA: Tablas no utilizadas eliminadas';
PRINT '';

-- ============================================
-- PARTE 2: CREAR ÍNDICES DE OPTIMIZACIÓN
-- ============================================
PRINT 'PARTE 2: Creando índices de optimización...';
PRINT '';

-- 1. ÍNDICES PARA BÚSQUEDAS DE TEXTO
PRINT '  1.1 Creando índices para búsquedas de texto...';

-- Usuarios
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_usuarios_busqueda' AND object_id = OBJECT_ID('dbo.usuarios'))
BEGIN
    CREATE INDEX idx_usuarios_busqueda ON dbo.usuarios (nombre_usuario, correo);
    PRINT '     ✓ idx_usuarios_busqueda creado';
END

-- Clientes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_clientes_busqueda' AND object_id = OBJECT_ID('dbo.clientes'))
BEGIN
    CREATE INDEX idx_clientes_busqueda ON dbo.clientes (nombre, correo);
    PRINT '     ✓ idx_clientes_busqueda creado';
END

-- Productos
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_productos_nombre' AND object_id = OBJECT_ID('dbo.productos'))
BEGIN
    CREATE INDEX idx_productos_nombre ON dbo.productos (nombre);
    PRINT '     ✓ idx_productos_nombre creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_productos_descripcion' AND object_id = OBJECT_ID('dbo.productos'))
BEGIN
    CREATE INDEX idx_productos_descripcion ON dbo.productos (descripcion) WHERE descripcion IS NOT NULL;
    PRINT '     ✓ idx_productos_descripcion creado';
END

-- 2. ÍNDICES PARA FILTROS POR ESTADO Y FECHA
PRINT '  1.2 Creando índices para filtros por estado y fecha...';

-- Órdenes de venta
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ordenes_venta_estado_fecha' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
BEGIN
    CREATE INDEX idx_ordenes_venta_estado_fecha ON dbo.ordenes_venta (estado, fecha DESC, id DESC);
    PRINT '     ✓ idx_ordenes_venta_estado_fecha creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ordenes_venta_cliente_fecha' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
BEGIN
    CREATE INDEX idx_ordenes_venta_cliente_fecha ON dbo.ordenes_venta (cliente_id, fecha DESC);
    PRINT '     ✓ idx_ordenes_venta_cliente_fecha creado';
END

-- Órdenes de compra
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ordenes_compra_estado_fecha' AND object_id = OBJECT_ID('dbo.ordenes_compra'))
BEGIN
    CREATE INDEX idx_ordenes_compra_estado_fecha ON dbo.ordenes_compra (estado, fecha DESC, id DESC);
    PRINT '     ✓ idx_ordenes_compra_estado_fecha creado';
END

-- Reservas
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'reservas' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_reservas_estado_fecha' AND object_id = OBJECT_ID('dbo.reservas'))
    BEGIN
        CREATE INDEX idx_reservas_estado_fecha ON dbo.reservas (estado, fecha_reserva DESC);
        PRINT '     ✓ idx_reservas_estado_fecha creado';
    END
END

-- Usuarios activos
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_usuarios_activo' AND object_id = OBJECT_ID('dbo.usuarios'))
BEGIN
    CREATE INDEX idx_usuarios_activo ON dbo.usuarios (activo) WHERE activo = 1;
    PRINT '     ✓ idx_usuarios_activo creado';
END

-- 3. ÍNDICES PARA FOREIGN KEYS CRÍTICAS
PRINT '  1.3 Creando índices para foreign keys críticas...';

-- Items de orden de venta
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_items_orden_venta_variante' AND object_id = OBJECT_ID('dbo.items_orden_venta'))
BEGIN
    CREATE INDEX idx_items_orden_venta_variante ON dbo.items_orden_venta (variante_producto_id);
    PRINT '     ✓ idx_items_orden_venta_variante creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_items_orden_venta_orden' AND object_id = OBJECT_ID('dbo.items_orden_venta'))
BEGIN
    CREATE INDEX idx_items_orden_venta_orden ON dbo.items_orden_venta (orden_venta_id);
    PRINT '     ✓ idx_items_orden_venta_orden creado';
END

-- Items de orden de compra
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'items_orden_compra' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_items_orden_compra_variante' AND object_id = OBJECT_ID('dbo.items_orden_compra'))
    BEGIN
        CREATE INDEX idx_items_orden_compra_variante ON dbo.items_orden_compra (variante_producto_id);
        PRINT '     ✓ idx_items_orden_compra_variante creado';
    END
END

-- Variantes de producto
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_variantes_producto_producto' AND object_id = OBJECT_ID('dbo.variantes_producto'))
BEGIN
    CREATE INDEX idx_variantes_producto_producto ON dbo.variantes_producto (producto_id);
    PRINT '     ✓ idx_variantes_producto_producto creado';
END

-- Productos
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_productos_categoria' AND object_id = OBJECT_ID('dbo.productos'))
BEGIN
    CREATE INDEX idx_productos_categoria ON dbo.productos (categoria_id) WHERE categoria_id IS NOT NULL;
    PRINT '     ✓ idx_productos_categoria creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_productos_marca' AND object_id = OBJECT_ID('dbo.productos'))
BEGIN
    CREATE INDEX idx_productos_marca ON dbo.productos (marca_id) WHERE marca_id IS NOT NULL;
    PRINT '     ✓ idx_productos_marca creado';
END

-- Stock por almacén
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_producto_almacen_variante_almacen' AND object_id = OBJECT_ID('dbo.producto_almacen'))
BEGIN
    CREATE INDEX idx_producto_almacen_variante_almacen ON dbo.producto_almacen (variante_producto_id, almacen_id);
    PRINT '     ✓ idx_producto_almacen_variante_almacen creado';
END

-- 4. ÍNDICES COMPUESTOS
PRINT '  1.4 Creando índices compuestos...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_productos_categoria_marca_nombre' AND object_id = OBJECT_ID('dbo.productos'))
BEGIN
    CREATE INDEX idx_productos_categoria_marca_nombre ON dbo.productos (categoria_id, marca_id, nombre);
    PRINT '     ✓ idx_productos_categoria_marca_nombre creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_ordenes_venta_cliente_estado_fecha' AND object_id = OBJECT_ID('dbo.ordenes_venta'))
BEGIN
    CREATE INDEX idx_ordenes_venta_cliente_estado_fecha ON dbo.ordenes_venta (cliente_id, estado, fecha DESC);
    PRINT '     ✓ idx_ordenes_venta_cliente_estado_fecha creado';
END

PRINT '';
PRINT 'PARTE 2 COMPLETADA: Índices de optimización creados';
PRINT '';

-- ============================================
-- PARTE 3: ACTUALIZAR ESTADÍSTICAS
-- ============================================
PRINT 'PARTE 3: Actualizando estadísticas de tablas...';
PRINT '';

UPDATE STATISTICS dbo.usuarios;
PRINT '  ✓ Estadísticas actualizadas: usuarios';

UPDATE STATISTICS dbo.clientes;
PRINT '  ✓ Estadísticas actualizadas: clientes';

UPDATE STATISTICS dbo.productos;
PRINT '  ✓ Estadísticas actualizadas: productos';

UPDATE STATISTICS dbo.ordenes_venta;
PRINT '  ✓ Estadísticas actualizadas: ordenes_venta';

UPDATE STATISTICS dbo.items_orden_venta;
PRINT '  ✓ Estadísticas actualizadas: items_orden_venta';

UPDATE STATISTICS dbo.variantes_producto;
PRINT '  ✓ Estadísticas actualizadas: variantes_producto';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ordenes_compra' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    UPDATE STATISTICS dbo.ordenes_compra;
    PRINT '  ✓ Estadísticas actualizadas: ordenes_compra';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'producto_almacen' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    UPDATE STATISTICS dbo.producto_almacen;
    PRINT '  ✓ Estadísticas actualizadas: producto_almacen';
END

PRINT '';
PRINT 'PARTE 3 COMPLETADA: Estadísticas actualizadas';
PRINT '';

-- ============================================
-- FINALIZACIÓN
-- ============================================
PRINT '========================================';
PRINT 'OPTIMIZACIÓN COMPLETADA EXITOSAMENTE';
PRINT '========================================';
PRINT '';
PRINT 'RESUMEN:';
PRINT '  - Tablas no utilizadas eliminadas';
PRINT '  - Índices de optimización creados';
PRINT '  - Estadísticas actualizadas';
PRINT '';
PRINT 'NOTA: La funcionalidad del sistema NO ha cambiado.';
PRINT '      Solo se optimizó el rendimiento de la base de datos.';
PRINT '';

-- Confirmar transacción
COMMIT TRANSACTION;

PRINT 'Transacción confirmada.';
GO

