
@echo off
title Music^&Sport
cd /d "%~dp0"

echo ================================
echo       MUSIC^&SPORT
echo ================================
echo.

echo Compilando aplicacion...
call pnpm build

if errorlevel 1 (
    echo ERROR al compilar.
    pause
    exit /b 1
)

echo Iniciando servidor...

start "MusicSport-Servidor" cmd /k "cd /d ""%~dp0"" && set NODE_ENV=development && node server/index.js"

timeout /t 5 /nobreak >nul
start "" http://localhost:3000

pause
