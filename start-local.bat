@echo off
echo ============================================
echo   Open Notebook - Quick Start with Tunnel
echo ============================================
echo.

REM Check if .env exists, if not copy from .env.local
if not exist .env (
    echo Creating .env file...
    copy .env.local .env
)

echo Starting Open Notebook with Docker...
echo.
echo Press Ctrl+C to stop
echo.

docker-compose -f docker-compose.single.yml up
