# Open Notebook - Development Mode Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Open Notebook (Dev Mode)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check SurrealDB
Write-Host "Checking SurrealDB..." -ForegroundColor Yellow
$surrealRunning = docker ps --filter "name=surrealdb" --filter "status=running" -q
if (-not $surrealRunning) {
    Write-Host "Starting SurrealDB..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up -d surrealdb
    Start-Sleep -Seconds 3
}
Write-Host "✓ SurrealDB is running" -ForegroundColor Green

# Start Backend API in new window
Write-Host "`nStarting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Backend API Server' -ForegroundColor Green; python run_api.py"
Start-Sleep -Seconds 5

# Start Frontend in new window
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Frontend Development Server' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 10

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n📍 Access your application at:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000`n" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host "Features:" -ForegroundColor Yellow
Write-Host "  🕸️  Knowledge Graph Visualization" -ForegroundColor Cyan
Write-Host "  📚 Ask and Learn" -ForegroundColor Cyan
Write-Host "  🎙️  Multi-speaker Podcasts" -ForegroundColor Cyan
Write-Host "  🔍 Advanced Search & Chat" -ForegroundColor Cyan
Write-Host "`nTwo new windows have been opened for Backend and Frontend."
Write-Host "Keep them running while using the application.`n" -ForegroundColor Gray
