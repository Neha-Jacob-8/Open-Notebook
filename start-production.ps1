# Open Notebook - Production Mode Startup Script
# This script starts the backend API and frontend in production mode

Write-Host "Starting Open Notebook in Production Mode" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if SurrealDB is running
Write-Host "Checking SurrealDB..." -ForegroundColor Yellow
$surrealRunning = docker ps --filter "name=surrealdb" --filter "status=running" -q
if (-not $surrealRunning) {
    Write-Host "SurrealDB not running. Starting..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up -d surrealdb
    Write-Host "Waiting for SurrealDB to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}
Write-Host "SurrealDB is running" -ForegroundColor Green
Write-Host ""

# Set production environment variables
$env:API_RELOAD = "false"
$env:NODE_ENV = "production"
$env:API_HOST = "127.0.0.1"
$env:API_PORT = "5055"
$env:PORT = "8502"

# Build frontend if needed
Write-Host "Building frontend for production..." -ForegroundColor Yellow
Push-Location frontend
if (-not (Test-Path ".next")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm ci
}
Write-Host "Building Next.js application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Start API in background
Write-Host "Starting Backend API (production mode)..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    $env:API_RELOAD = "false"
    $env:API_HOST = "0.0.0.0"
    $env:API_PORT = "5055"
    Set-Location $using:PWD
    uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 --workers 2
}

# Wait for API to be ready
Write-Host "Waiting for API to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$apiReady = $false

while ($attempt -lt $maxAttempts -and -not $apiReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5055/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $apiReady = $true
        }
    } catch {
        # API not ready yet
    }
    if (-not $apiReady) {
        Start-Sleep -Seconds 1
        $attempt++
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
}

Write-Host ""
if ($apiReady) {
    Write-Host "API is ready!" -ForegroundColor Green
} else {
    Write-Host "API failed to start within 30 seconds" -ForegroundColor Red
    Stop-Job $apiJob
    Remove-Job $apiJob
    exit 1
}
Write-Host ""

# Start Frontend
Write-Host "Starting Frontend (production mode)..." -ForegroundColor Yellow
Push-Location frontend
$frontendJob = Start-Job -ScriptBlock {
    $env:NODE_ENV = "production"
    $env:PORT = "8502"
    Set-Location $using:PWD/frontend
    npm run start
}
Pop-Location

# Wait for frontend to be ready
Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if frontend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8502" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "Frontend is ready!" -ForegroundColor Green
    }
} catch {
    Write-Host "Frontend may still be starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Open Notebook is running in Production Mode!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:8502" -ForegroundColor Cyan
Write-Host "API:       http://localhost:5055" -ForegroundColor Cyan
Write-Host "SurrealDB: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Wait for user to stop
try {
    Wait-Job $apiJob, $frontendJob
} finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Job $apiJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "All services stopped" -ForegroundColor Green
}
