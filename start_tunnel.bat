@echo off
title FreshCheck Backend & Tunnel Connector
cd /d "%~dp0"

echo ========================================================
echo   FreshCheck Local Backend to Vercel Tunnel Launcher
echo ========================================================
echo.

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe start_tunnel.py %*
) else (
    python start_tunnel.py %*
)

pause
