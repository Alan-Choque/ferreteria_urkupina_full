-- Script SQL para migrar usuarios existentes con roles inventados a roles reales
-- Ejecutar en SQL Server Management Studio (SSMS)

USE ferreteria_urkupina;
GO

-- 1. Verificar qué roles existen actualmente
SELECT id, nombre, descripcion 
FROM dbo.roles 
ORDER BY nombre;
GO

-- 2. Verificar usuarios y sus roles actuales
SELECT 
    u.id,
    u.nombre_usuario,
    u.correo,
    STRING_AGG(r.nombre, ', ') AS roles_actuales
FROM dbo.usuarios u
LEFT JOIN dbo.usuarios_roles ur ON u.id = ur.usuario_id
LEFT JOIN dbo.roles r ON ur.rol_id = r.id
GROUP BY u.id, u.nombre_usuario, u.correo
ORDER BY u.id;
GO

-- 3. Obtener IDs de los roles reales
DECLARE @ADMIN_ID INT = (SELECT id FROM dbo.roles WHERE nombre = 'ADMIN');
DECLARE @VENTAS_ID INT = (SELECT id FROM dbo.roles WHERE nombre = 'VENTAS');
DECLARE @INVENTARIOS_ID INT = (SELECT id FROM dbo.roles WHERE nombre = 'INVENTARIOS');
DECLARE @SUPERVISOR_ID INT = (SELECT id FROM dbo.roles WHERE nombre = 'SUPERVISOR');

-- 4. Migrar usuarios: Si tienen roles que no existen, asignarles SUPERVISOR por defecto
-- (Esto es solo un ejemplo - ajusta según tus necesidades específicas)

-- ============================================
-- ASIGNAR ROLES A USUARIOS ESPECÍFICOS
-- ============================================

-- Usuario admin.root (ID: 9) -> ADMIN (acceso completo)
IF @ADMIN_ID IS NOT NULL
BEGIN
    -- Eliminar roles existentes si los tiene
    DELETE FROM dbo.usuarios_roles WHERE usuario_id = 9;
    -- Asignar ADMIN
    INSERT INTO dbo.usuarios_roles (usuario_id, rol_id)
    VALUES (9, @ADMIN_ID);
    PRINT 'Usuario admin.root (ID: 9) -> Asignado rol ADMIN';
END
ELSE
BEGIN
    PRINT 'ERROR: No se encontró el rol ADMIN';
END

-- Usuario victor (ID: 1) -> ADMIN (asumiendo que es administrador)
-- Si es vendedor, cambia @ADMIN_ID por @VENTAS_ID
IF @ADMIN_ID IS NOT NULL
BEGIN
    DELETE FROM dbo.usuarios_roles WHERE usuario_id = 1;
    INSERT INTO dbo.usuarios_roles (usuario_id, rol_id)
    VALUES (1, @ADMIN_ID);
    PRINT 'Usuario victor (ID: 1) -> Asignado rol ADMIN';
END

-- Usuario jose (ID: 2) -> INVENTARIOS (asumiendo que maneja inventario)
-- Si solo necesita consultar, cambia @INVENTARIOS_ID por @SUPERVISOR_ID
IF @INVENTARIOS_ID IS NOT NULL
BEGIN
    DELETE FROM dbo.usuarios_roles WHERE usuario_id = 2;
    INSERT INTO dbo.usuarios_roles (usuario_id, rol_id)
    VALUES (2, @INVENTARIOS_ID);
    PRINT 'Usuario jose (ID: 2) -> Asignado rol INVENTARIOS';
END

-- Opción B: Si un usuario no tiene ningún rol, asignarle SUPERVISOR por defecto
INSERT INTO dbo.usuarios_roles (usuario_id, rol_id)
SELECT u.id, @SUPERVISOR_ID
FROM dbo.usuarios u
WHERE u.id NOT IN (SELECT usuario_id FROM dbo.usuarios_roles)
AND @SUPERVISOR_ID IS NOT NULL;
GO

-- Opción B: Si quieres migrar usuarios con roles antiguos específicos
-- (Descomenta y ajusta según tus necesidades)

/*
-- Migrar usuarios con rol "admin" (si existe) a ADMIN
UPDATE ur
SET ur.rol_id = @ADMIN_ID
FROM dbo.usuarios_roles ur
INNER JOIN dbo.roles r ON ur.rol_id = r.id
WHERE r.nombre IN ('admin', 'Admin', 'ADMIN')
AND @ADMIN_ID IS NOT NULL;

-- Migrar usuarios con rol "manager" o "gerente" a VENTAS (o el que prefieras)
UPDATE ur
SET ur.rol_id = @VENTAS_ID
FROM dbo.usuarios_roles ur
INNER JOIN dbo.roles r ON ur.rol_id = r.id
WHERE r.nombre IN ('manager', 'Manager', 'MANAGER', 'gerente', 'Gerente')
AND @VENTAS_ID IS NOT NULL;

-- Migrar usuarios con rol "staff" o "user" a SUPERVISOR
UPDATE ur
SET ur.rol_id = @SUPERVISOR_ID
FROM dbo.usuarios_roles ur
INNER JOIN dbo.roles r ON ur.rol_id = r.id
WHERE r.nombre IN ('staff', 'Staff', 'STAFF', 'user', 'User', 'USER')
AND @SUPERVISOR_ID IS NOT NULL;
*/

-- 5. Verificar resultado final
SELECT 
    u.id,
    u.nombre_usuario,
    u.correo,
    STRING_AGG(r.nombre, ', ') AS roles_finales
FROM dbo.usuarios u
LEFT JOIN dbo.usuarios_roles ur ON u.id = ur.usuario_id
LEFT JOIN dbo.roles r ON ur.rol_id = r.id
GROUP BY u.id, u.nombre_usuario, u.correo
ORDER BY u.id;
GO

