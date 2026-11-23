
@echo off
title Music^&Sport
cd /d "%~dp0"

echo ================================
echo       MUSIC^&SPORT
echo ================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado.
    echo Instala Node.js 22 o superior y vuelve a ejecutar este archivo.
    pause
    exit /b 1
)

echo Preparando dependencias...
if not exist "node_modules" (
    call corepack pnpm install --frozen-lockfile
    if errorlevel 1 (
        echo ERROR al instalar las dependencias.
        pause
        exit /b 1
    )
)

call corepack pnpm --version >nul 2>nul
if errorlevel 1 (
    echo ERROR: No se pudo habilitar pnpm.
    pause
    exit /b 1
)

echo Compilando aplicacion...
call corepack pnpm build

if errorlevel 1 (
    echo ERROR al compilar.
    pause
    exit /b 1
)

echo Iniciando servidor...

start "MusicSport-Servidor" cmd /k "cd /d ""%~dp0"" && set NODE_ENV=production && node server/index.js"

timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"
