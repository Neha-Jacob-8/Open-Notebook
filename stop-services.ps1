# Stop all Open Notebook services
Write-Host "Stopping Open Notebook services..." -ForegroundColor Yellow

# Kill any running Python/Node processes on our ports
$processes = Get-NetTCPConnection -LocalPort 5055,8502 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($procId in $processes) {
        try {
            Write-Host "Killing process $procId..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "Could not stop process $procId" -ForegroundColor Red
        }
    }
    Write-Host "Waiting for ports to be released..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

Write-Host "All services stopped" -ForegroundColor Green
