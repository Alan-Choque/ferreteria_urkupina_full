# Guía para Aplicar la Migración de Base de Datos

## Cambios que se aplicarán

1. **Agregar columna `usuario_id` en `clientes`**
   - ForeignKey a `usuarios.id`
   - Permite NULL (clientes invitados)
   - Constraint único (un usuario = un cliente)

2. **Agregar índices para mejorar rendimiento**
   - `ix_clientes_correo` - Búsquedas por email
   - `ix_clientes_usuario_id` - Búsquedas por relación directa
   - `ix_usuarios_correo` - Login por email
   - `ix_usuarios_nombre_usuario` - Búsquedas por username

3. **Vincular clientes existentes con usuarios**
   - Automáticamente vincula clientes con usuarios que tengan el mismo email

## Pasos para Aplicar

### Opción 1: Desde Docker (Recomendado)

```bash
# 1. Verificar estado actual de migraciones
docker compose exec api alembic current

# 2. Ver qué migraciones están pendientes
docker compose exec api alembic heads

# 3. Aplicar la migración
docker compose exec api alembic upgrade head

# 4. Verificar que se aplicó correctamente
docker compose exec api alembic current
```

### Opción 2: Localmente (si no usas Docker)

```bash
# 1. Ir al directorio backend
cd backend

# 2. Activar entorno virtual (si usas uno)
# venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 3. Verificar estado actual
alembic current

# 4. Aplicar la migración
alembic upgrade head

# 5. Verificar que se aplicó
alembic current
```

## Verificar que Funcionó

### 1. Verificar columna agregada

```sql
-- En SQL Server Management Studio o Azure Data Studio
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME = 'clientes'
  AND COLUMN_NAME = 'usuario_id';
```

### 2. Verificar índices creados

```sql
SELECT 
    i.name AS IndexName,
    t.name AS TableName,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('clientes', 'usuarios')
  AND i.name LIKE 'ix_%'
ORDER BY t.name, i.name;
```

### 3. Verificar ForeignKey

```sql
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fc ON fk.object_id = fc.constraint_object_id
WHERE fk.name = 'fk_clientes_usuario_id_usuarios';
```

## Revertir la Migración (si es necesario)

```bash
# Desde Docker
docker compose exec api alembic downgrade -1

# Localmente
cd backend
alembic downgrade -1
```

## Notas Importantes

⚠️ **Antes de aplicar:**
- Haz un backup de la base de datos
- Verifica que no haya datos críticos que puedan afectarse
- La migración es segura: solo agrega columnas e índices, no elimina datos

✅ **Después de aplicar:**
- Los clientes existentes se vincularán automáticamente con usuarios (por email)
- Los nuevos registros usarán la relación directa
- El sistema seguirá funcionando con clientes sin usuario (invitados)

## Solución de Problemas

### Error: "Table already exists"
- Esto es normal si la tabla ya existe
- La migración solo agrega la columna, no crea la tabla

### Error: "Column already exists"
- Significa que la migración ya se aplicó
- Verifica con `alembic current`

### Error: "Foreign key constraint failed"
- Verifica que no haya datos inconsistentes
- La migración incluye un script para vincular clientes existentes

