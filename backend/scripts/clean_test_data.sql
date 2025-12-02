-- Script para limpiar todos los datos de prueba
-- Mantiene solo los productos originales y un usuario admin
-- Ejecutar con cuidado: este script elimina datos permanentemente

USE ferreteria_urkupina;
GO

BEGIN TRANSACTION;

PRINT 'Iniciando limpieza de datos de prueba...';

-- 1. Eliminar datos relacionados con transacciones (en orden de dependencias)
PRINT 'Eliminando pagos de clientes...';
DELETE FROM dbo.pagos_cliente;
PRINT 'Eliminando items de facturas...';
DELETE FROM dbo.items_factura_venta;
PRINT 'Eliminando facturas de venta...';
DELETE FROM dbo.facturas_venta;

-- 2. Eliminar reservas y sus items
PRINT 'Eliminando items de reservas...';
DELETE FROM dbo.items_reserva;
PRINT 'Eliminando reservas...';
DELETE FROM dbo.reservas;

-- 3. Eliminar órdenes de compra y sus items
PRINT 'Eliminando items de órdenes de compra...';
DELETE FROM dbo.items_orden_compra;
PRINT 'Eliminando órdenes de compra...';
DELETE FROM dbo.ordenes_compra;

-- 4. Eliminar órdenes de venta y sus items
PRINT 'Eliminando items de órdenes de venta...';
DELETE FROM dbo.items_orden_venta;
PRINT 'Eliminando órdenes de venta...';
DELETE FROM dbo.ordenes_venta;

-- 5. Eliminar contactos de proveedores
PRINT 'Eliminando contactos de proveedores...';
DELETE FROM dbo.contactos_proveedor;

-- 6. Eliminar relación proveedor-producto
PRINT 'Eliminando relaciones proveedor-producto...';
DELETE FROM dbo.proveedor_producto;

-- 7. Eliminar proveedores (excepto si hay alguno original que quieras mantener)
PRINT 'Eliminando proveedores...';
DELETE FROM dbo.proveedores;

-- 8. Eliminar clientes (excepto los que están vinculados a usuarios que queremos mantener)
PRINT 'Eliminando clientes no vinculados al usuario admin...';
-- Primero desvincular clientes de usuarios que no sean admin
UPDATE dbo.clientes SET usuario_id = NULL WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (
    SELECT id FROM dbo.usuarios WHERE id IN (
        SELECT ur.usuario_id FROM dbo.usuarios_roles ur
        INNER JOIN dbo.roles r ON ur.rol_id = r.id
        WHERE r.nombre = 'ADMIN'
    )
);
-- Eliminar clientes que no están vinculados al admin
DELETE FROM dbo.clientes WHERE usuario_id IS NULL OR usuario_id NOT IN (
    SELECT id FROM dbo.usuarios WHERE id IN (
        SELECT ur.usuario_id FROM dbo.usuarios_roles ur
        INNER JOIN dbo.roles r ON ur.rol_id = r.id
        WHERE r.nombre = 'ADMIN'
    )
);

-- 9. Eliminar usuarios excepto el admin
PRINT 'Eliminando usuarios no admin...';
-- Eliminar roles de usuarios no admin primero
DELETE FROM dbo.usuarios_roles WHERE usuario_id NOT IN (
    SELECT ur.usuario_id FROM dbo.usuarios_roles ur
    INNER JOIN dbo.roles r ON ur.rol_id = r.id
    WHERE r.nombre = 'ADMIN'
    GROUP BY ur.usuario_id
    HAVING COUNT(*) > 0
);

-- Eliminar usuarios que no tienen rol ADMIN
DELETE FROM dbo.usuarios WHERE id NOT IN (
    SELECT DISTINCT ur.usuario_id FROM dbo.usuarios_roles ur
    INNER JOIN dbo.roles r ON ur.rol_id = r.id
    WHERE r.nombre = 'ADMIN'
);

-- Si no hay ningún usuario admin, crear uno por defecto
IF NOT EXISTS (SELECT 1 FROM dbo.usuarios u
    INNER JOIN dbo.usuarios_roles ur ON u.id = ur.usuario_id
    INNER JOIN dbo.roles r ON ur.rol_id = r.id
    WHERE r.nombre = 'ADMIN')
BEGIN
    PRINT 'No se encontró usuario admin, creando uno por defecto...';
    
    -- Obtener el ID del rol ADMIN
    DECLARE @admin_role_id INT;
    SELECT @admin_role_id = id FROM dbo.roles WHERE nombre = 'ADMIN';
    
    IF @admin_role_id IS NOT NULL
    BEGIN
        -- Crear usuario admin por defecto
        DECLARE @admin_user_id INT;
        INSERT INTO dbo.usuarios (nombre_usuario, correo, hash_contrasena, fecha_creacion, fecha_modificacion, activo)
        VALUES ('admin', 'admin@ferreteria.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJZ5Q5Q5C', GETDATE(), GETDATE(), 1);
        SET @admin_user_id = SCOPE_IDENTITY();
        
        -- Asignar rol ADMIN
        INSERT INTO dbo.usuarios_roles (usuario_id, rol_id)
        VALUES (@admin_user_id, @admin_role_id);
        
        PRINT 'Usuario admin creado con ID: ' + CAST(@admin_user_id AS VARCHAR);
    END
    ELSE
    BEGIN
        PRINT 'ERROR: No se encontró el rol ADMIN. Asegúrate de que exista.';
    END
END
ELSE
BEGIN
    PRINT 'Usuario admin encontrado y mantenido.';
END

-- 10. Limpiar datos de inventario relacionados con transacciones eliminadas
PRINT 'Limpiando ajustes de stock...';
DELETE FROM dbo.items_ajuste_stock;
DELETE FROM dbo.ajustes_stock;

PRINT 'Limpiando transferencias de stock...';
DELETE FROM dbo.items_transferencia_stock;
DELETE FROM dbo.transferencias_stock;

PRINT 'Limpiando libro de stock (historial)...';
DELETE FROM dbo.libro_stock;

-- 11. Limpiar promociones
PRINT 'Eliminando reglas de promociones...';
DELETE FROM dbo.reglas_promocion;
PRINT 'Eliminando promociones...';
DELETE FROM dbo.promociones;

-- 12. Limpiar idempotency keys (opcional, pero recomendado)
PRINT 'Limpiando claves de idempotencia...';
DELETE FROM dbo.idempotency_keys WHERE fecha_creacion < DATEADD(day, -7, GETDATE());

-- 13. Verificar que quede al menos un usuario admin
DECLARE @admin_count INT;
SELECT @admin_count = COUNT(DISTINCT u.id)
FROM dbo.usuarios u
INNER JOIN dbo.usuarios_roles ur ON u.id = ur.usuario_id
INNER JOIN dbo.roles r ON ur.rol_id = r.id
WHERE r.nombre = 'ADMIN' AND u.activo = 1;

IF @admin_count = 0
BEGIN
    PRINT 'ERROR: No quedan usuarios admin activos. Revirtiendo transacción...';
    ROLLBACK TRANSACTION;
    RETURN;
END

PRINT 'Limpieza completada exitosamente.';
PRINT 'Usuarios admin restantes: ' + CAST(@admin_count AS VARCHAR);
PRINT 'Productos mantenidos: ' + CAST((SELECT COUNT(*) FROM dbo.productos) AS VARCHAR);

COMMIT TRANSACTION;
GO

PRINT 'Script de limpieza ejecutado exitosamente.';
PRINT 'NOTA: Los productos originales se mantienen intactos.';
PRINT 'NOTA: Se mantiene al menos un usuario admin.';

