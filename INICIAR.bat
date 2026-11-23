
@echo off
title Music^&Sport
cd /d "%~dp0"

echo =================================
echo          MUSIC^&SPORT
echo =================================
echo.

echo [1/5] Comprobando Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado.
    echo Instala Node.js 22 o superior.
    pause
    exit /b 1
)

echo [2/5] Comprobando pnpm...
call corepack pnpm --version
if errorlevel 1 (
    echo ERROR: No se pudo habilitar pnpm.
    echo Comprueba la instalacion de Node.js y Corepack.
    pause
    exit /b 1
)

echo.
echo [3/5] Comprobando dependencias...

if not exist "node_modules\.pnpm\lock.yaml" (
    echo Instalando dependencias...
    call corepack pnpm install --frozen-lockfile

    if errorlevel 1 (
        echo ERROR al instalar las dependencias.
        pause
        exit /b 1
    )
)

echo.
echo [4/5] Compilando aplicacion...
call corepack pnpm build

if errorlevel 1 (
    echo ERROR al compilar la aplicacion.
    pause
    exit /b 1
)

echo.
echo [5/5] Iniciando servidor local...

start "MusicSport-Servidor" cmd /k "cd /d ""%~dp0"" && set NODE_ENV=production && set RECOVERY_MODE=simulated && node server/index.js"

echo.
echo Esperando respuesta del servidor...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(30); do { try { $r=Invoke-WebRequest -UseBasicParsing 'http://localhost:3000/api/status' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"

if errorlevel 1 (
    echo.
    echo ERROR: El servidor no respondio en 30 segundos.
    echo Revisa la ventana MusicSport-Servidor.
    pause
    exit /b 1
)

echo.
echo Music^&Sport esta funcionando correctamente.
echo Abriendo navegador...

start "" "http://localhost:3000"

exit /b 0
