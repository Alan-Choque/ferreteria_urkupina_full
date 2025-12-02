@echo off
REM Script para aplicar la migración de base de datos
REM Uso: aplicar_migracion.bat

echo ========================================
echo Aplicando Migracion de Base de Datos
echo ========================================
echo.

echo [1/4] Verificando estado actual de migraciones...
docker compose exec api alembic current
echo.

echo [2/4] Verificando migraciones pendientes...
docker compose exec api alembic heads
echo.

echo [3/4] Aplicando migracion...
docker compose exec api alembic upgrade head
echo.

echo [4/4] Verificando que se aplico correctamente...
docker compose exec api alembic current
echo.

echo ========================================
echo Migracion completada!
echo ========================================
echo.
echo Verifica que todo funcione correctamente probando:
echo - Crear un nuevo usuario (debe vincularse automaticamente con cliente)
echo - Ver pedidos del usuario en su perfil
echo - Ver reservaciones del usuario
echo.
pause

