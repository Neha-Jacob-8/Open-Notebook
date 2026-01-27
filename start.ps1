# Open Notebook - Quick Start Script
# Run this script to start the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Open Notebook - Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Navigate to project directory
Set-Location $PSScriptRoot

# Start Docker container
Write-Host "`n[1/2] Starting Docker container..." -ForegroundColor Yellow
docker-compose -f docker-compose.single.yml up -d

# Wait for services to start
Write-Host "`nWaiting for services to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Check if services are healthy
Write-Host "`n[2/2] Checking service health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5055/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  API: OK" -ForegroundColor Green
} catch {
    Write-Host "  API: Starting up (may take a moment)" -ForegroundColor Yellow
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:8502" -UseBasicParsing -TimeoutSec 5
    Write-Host "  Frontend: OK" -ForegroundColor Green
} catch {
    Write-Host "  Frontend: Starting up (may take a moment)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Application Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nLocal Access: " -NoNewline
Write-Host "http://localhost:8502" -ForegroundColor Blue

# Ask if user wants public access
Write-Host "`n"
$startTunnel = Read-Host "Start Cloudflare Tunnel for public access? (y/n)"

if ($startTunnel -eq 'y' -or $startTunnel -eq 'Y') {
    Write-Host "`nStarting Cloudflare Tunnel..." -ForegroundColor Yellow
    Write-Host "Check the new window for your public URL" -ForegroundColor Gray
    
    # Stop any existing tunnel
    Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    # Start tunnel in new window
    $cloudflaredPath = Join-Path $env:USERPROFILE "cloudflared.exe"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$cloudflaredPath' tunnel --url http://localhost:8502 --protocol http2"
    
    Write-Host "`nTunnel started! Look for URL like:" -ForegroundColor Green
    Write-Host "  https://[random-words].trycloudflare.com" -ForegroundColor Blue
}

Write-Host "`n"
