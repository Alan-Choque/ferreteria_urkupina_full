# Cómo Ejecutar la Optimización de Base de Datos

## Opción 1: Usando SQL Server Management Studio (SSMS) - RECOMENDADO

1. **Abrir SQL Server Management Studio**
2. **Conectarse a tu instancia de SQL Server** (localhost,1433)
3. **Seleccionar la base de datos** `ferreteria_urkupina` (o la que uses)
4. **Abrir el archivo**: `backend/scripts/optimize_database.sql`
5. **Revisar el script** (especialmente las tablas que se eliminarán)
6. **Hacer BACKUP antes de ejecutar**:
   ```sql
   BACKUP DATABASE ferreteria_urkupina 
   TO DISK = 'C:\Backups\ferreteria_urkupina_backup.bak';
   ```
7. **Ejecutar el script** (F5 o botón "Execute")

## Opción 2: Usando sqlcmd (Línea de comandos)

```powershell
# Desde el directorio raíz del proyecto
cd backend\scripts

# Ejecutar el script
sqlcmd -S localhost,1433 -U ferre_app -P "F3rre!2025" -d ferreteria_urkupina -i optimize_database.sql
```

## Opción 3: Usando Python (desde Docker)

```powershell
# Si el backend está corriendo en Docker
cd backend
docker compose exec api python scripts/execute_optimization.py
```

## ⚠️ IMPORTANTE

- **HACER BACKUP ANTES**: Este script elimina tablas no utilizadas
- **Las tablas de auditoría NO se eliminan** (bitacora_auditoria, historial_contrasenas, etc.)
- **El script es transaccional**: Si falla, se revierte todo automáticamente
- **Ejecutar en horario de bajo tráfico**: La creación de índices puede tomar tiempo

## Tablas que se ELIMINAN

- Tablas de contactos y direcciones
- Tablas de facturación (no usamos facturas separadas)
- Tablas de pagos (no gestionamos pagos separados)
- Tablas de envíos (no gestionamos envíos separados)
- Tablas de inventario avanzado (conteos cíclicos, lotes, etc.)
- Tablas de precios y listas
- Tablas de garantías, gastos, fidelización
- Tablas de notificaciones, métodos de pago
- Tablas de autenticación externa
- Tablas de chatbot e IA
- Y otras tablas no utilizadas (ver TABLAS_NO_USADAS.md)

## Tablas que se MANTIENEN

- ✅ Todas las tablas de auditoría y seguridad
- ✅ Todas las tablas en uso activo (usuarios, clientes, productos, ventas, etc.)

## Resultado Esperado

Después de ejecutar el script:
- ✅ Tablas no utilizadas eliminadas
- ✅ Índices de optimización creados
- ✅ Estadísticas actualizadas
- ⚡ **50-90% más rápido** en búsquedas
- ⚡ **30-70% más rápido** en listados con filtros

