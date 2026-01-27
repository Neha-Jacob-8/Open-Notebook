# Open Notebook - Stop Script
# Run this script to stop the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Open Notebook - Stopping..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navigate to project directory
Set-Location $PSScriptRoot

# Stop Cloudflare tunnel
Write-Host "`n[1/2] Stopping Cloudflare Tunnel..." -ForegroundColor Yellow
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Write-Host "  Tunnel stopped" -ForegroundColor Green

# Stop Docker container
Write-Host "`n[2/2] Stopping Docker container..." -ForegroundColor Yellow
docker-compose -f docker-compose.single.yml down

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Application Stopped!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n"
