# backend/scripts/setup-firewall.ps1
# Script para crear regla de firewall en Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETUP FIREWALL - Puerto 8000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si la regla ya existe
$existingRule = Get-NetFirewallRule -Name "FastAPI-8000" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "✅ Regla de firewall 'FastAPI-8000' ya existe" -ForegroundColor Green
    Write-Host "   Para eliminarla: netsh advfirewall firewall delete rule name='FastAPI-8000'" -ForegroundColor Gray
} else {
    Write-Host "[1/2] Creando regla de firewall para puerto 8000..." -ForegroundColor Yellow
    
    # Crear regla de firewall
    netsh advfirewall firewall add rule name="FastAPI-8000" dir=in action=allow protocol=TCP localport=8000
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Regla de firewall creada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al crear regla de firewall" -ForegroundColor Red
        Write-Host "   Ejecuta como Administrador: netsh advfirewall firewall add rule name='FastAPI-8000' dir=in action=allow protocol=TCP localport=8000" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "[2/2] Verificando conexión TCP..." -ForegroundColor Yellow
$tcpTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -WarningAction SilentlyContinue

if ($tcpTest.TcpTestSucceeded) {
    Write-Host "✅ Conexión TCP exitosa en 127.0.0.1:8000" -ForegroundColor Green
} else {
    Write-Host "⚠️  Conexión TCP no disponible (puede ser normal si el contenedor no está corriendo)" -ForegroundColor Yellow
    Write-Host "   Asegúrate de que el contenedor esté corriendo: docker compose up -d" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

