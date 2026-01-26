@echo off
echo ============================================
echo   Creating Public Tunnel to Open Notebook
echo ============================================
echo.
echo Make sure your app is running first!
echo Then this will create a public URL.
echo.
echo Checking for cloudflared...

where cloudflared >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: cloudflared not found!
    echo.
    echo Please install it first:
    echo   winget install --id Cloudflare.cloudflared
    echo.
    echo Or download from:
    echo   https://github.com/cloudflare/cloudflared/releases/latest
    echo.
    pause
    exit /b 1
)

echo Found cloudflared!
echo.
echo Creating tunnel to http://localhost:8080...
echo.
echo You will see a public URL like:
echo   https://random-words-1234.trycloudflare.com
echo.
echo Share that URL with anyone!
echo.
echo Press Ctrl+C to stop the tunnel
echo.

cloudflared tunnel --url http://localhost:8080
