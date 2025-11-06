# backend/scripts/selftest.ps1
# Script de autoverificación para Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SELFTEST - Ferretería Urkupina Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que docker compose está corriendo
Write-Host "[1/6] Verificando contenedores Docker..." -ForegroundColor Yellow
docker compose ps

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: docker compose ps falló" -ForegroundColor Red
    Write-Host "   Asegúrate de estar en el directorio backend/" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Contenedores Docker verificados" -ForegroundColor Green
Write-Host ""

# 2. Verificar publicación del puerto
Write-Host "[2/6] Verificando publicación del puerto 8000..." -ForegroundColor Yellow
$portInfo = docker port backend-api-1 8000/tcp 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Puerto publicado: $portInfo" -ForegroundColor Green
} else {
    Write-Host "⚠️  Advertencia: No se pudo verificar puerto (puede ser normal si el contenedor no está corriendo)" -ForegroundColor Yellow
}

# Test-NetConnection
Write-Host "   Probando conexión TCP local..." -ForegroundColor Gray
$tcpTest = Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -WarningAction SilentlyContinue
if ($tcpTest.TcpTestSucceeded) {
    Write-Host "✅ Conexión TCP exitosa en 127.0.0.1:8000" -ForegroundColor Green
} else {
    Write-Host "❌ Conexión TCP falló en 127.0.0.1:8000" -ForegroundColor Red
    Write-Host "   HINT: Verifica firewall o que el contenedor esté corriendo" -ForegroundColor Yellow
}
Write-Host ""

# 3. Verificar health endpoint
Write-Host "[3/6] Probando endpoint /api/v1/health..." -ForegroundColor Yellow
$curlExe = "$Env:SystemRoot\System32\curl.exe"
$healthResponse = & $curlExe -s --http1.1 http://127.0.0.1:8000/api/v1/health 2>&1

if ($LASTEXITCODE -eq 0 -and $healthResponse -match '"status"') {
    Write-Host "✅ Health endpoint OK: $healthResponse" -ForegroundColor Green
} else {
    Write-Host "❌ Health endpoint falló" -ForegroundColor Red
    Write-Host "   Response: $healthResponse" -ForegroundColor Red
    Write-Host "   HINT: Verifica que el contenedor esté corriendo y que el puerto 8000 esté abierto" -ForegroundColor Yellow
    Write-Host "   HINT: Ejecuta: docker compose logs api --tail=50" -ForegroundColor Yellow
}
Write-Host ""

# 4. Verificar docs endpoint
Write-Host "[4/6] Probando endpoint /docs..." -ForegroundColor Yellow
$docsResponse = & $curlExe -s --http1.1 http://127.0.0.1:8000/docs 2>&1

if ($LASTEXITCODE -eq 0 -and $docsResponse -match "Swagger") {
    Write-Host "✅ Docs endpoint OK (Swagger UI disponible)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docs endpoint no disponible (puede ser normal si no está configurado)" -ForegroundColor Yellow
}
Write-Host ""

# 5. Verificar OpenAPI JSON
Write-Host "[5/6] Probando endpoint /openapi.json..." -ForegroundColor Yellow
$openapiResponse = & $curlExe -s --http1.1 http://127.0.0.1:8000/openapi.json 2>&1

if ($LASTEXITCODE -eq 0 -and $openapiResponse -match '"paths"') {
    Write-Host "✅ OpenAPI JSON OK (paths encontrados)" -ForegroundColor Green
} else {
    Write-Host "❌ OpenAPI JSON falló o no contiene paths" -ForegroundColor Red
    Write-Host "   Response: $($openapiResponse.Substring(0, [Math]::Min(200, $openapiResponse.Length)))" -ForegroundColor Red
}
Write-Host ""

# 6. Verificar conexión a DB
Write-Host "[6/6] Probando conexión a base de datos..." -ForegroundColor Yellow
$dbResponse = docker compose exec -T api python scripts/db_ping.py 2>&1

if ($dbResponse -match "DB OK") {
    Write-Host "✅ Conexión a DB OK" -ForegroundColor Green
} else {
    Write-Host "❌ Conexión a DB falló" -ForegroundColor Red
    Write-Host "   Response: $dbResponse" -ForegroundColor Red
    Write-Host "   HINT: Verifica DATABASE_URL en .env" -ForegroundColor Yellow
    Write-Host "   HINT: Verifica que el usuario ferre_app existe en SQL Server" -ForegroundColor Yellow
    Write-Host "   HINT: Verifica que SQL Server está corriendo en Windows" -ForegroundColor Yellow
}
Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allOk = $true
if (-not $tcpTest.TcpTestSucceeded) { $allOk = $false }
if ($healthResponse -notmatch '"status"') { $allOk = $false }
if ($dbResponse -notmatch "DB OK") { $allOk = $false }

if ($allOk) {
    Write-Host "✅ TODO OK - Backend funcionando correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs disponibles:" -ForegroundColor Cyan
    Write-Host "  - API: http://localhost:8000/api/v1" -ForegroundColor White
    Write-Host "  - Health: http://localhost:8000/api/v1/health" -ForegroundColor White
    Write-Host "  - Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  - OpenAPI: http://localhost:8000/openapi.json" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ ALGUNOS TESTS FALLARON - Revisa los mensajes arriba" -ForegroundColor Red
    Write-Host ""
    Write-Host "Comandos útiles para debug:" -ForegroundColor Yellow
    Write-Host "  - docker compose logs api --tail=50" -ForegroundColor White
    Write-Host "  - docker compose ps" -ForegroundColor White
    Write-Host "  - docker compose exec api python scripts/db_ping.py" -ForegroundColor White
    exit 1
}

