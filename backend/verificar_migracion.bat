@echo off
REM Script para verificar el estado de la migración
REM Uso: verificar_migracion.bat

echo ========================================
echo Verificando Estado de Migraciones
echo ========================================
echo.

echo Estado actual:
docker compose exec api alembic current
echo.

echo Migraciones disponibles:
docker compose exec api alembic history
echo.

echo Migraciones pendientes:
docker compose exec api alembic heads
echo.

pause

