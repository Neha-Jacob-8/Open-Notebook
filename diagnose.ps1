Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Open Notebook Diagnostics" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if services are running
Write-Host "`n1. Checking if services are running..." -ForegroundColor Yellow

# Check Frontend (port 3000)
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   [OK] Frontend is running on port 3000" -ForegroundColor Green
    }
} catch {
    Write-Host "   [ERROR] Frontend is NOT running on port 3000" -ForegroundColor Red
}

# Check Backend (port 5055)
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5055/health" -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "   [OK] Backend is running on port 5055" -ForegroundColor Green
    }
} catch {
    Write-Host "   [ERROR] Backend is NOT running on port 5055" -ForegroundColor Red
}

# Test API Endpoints
Write-Host "`n2. Testing API endpoints..." -ForegroundColor Yellow
$apiUrl = "http://localhost:3000"

try {
    $sources = Invoke-RestMethod -Uri "$apiUrl/api/sources" -Method Get
    $sourceCount = $sources.Count
    Write-Host "   [OK] Sources API: OK ($sourceCount sources found)" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Sources API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $transformations = Invoke-RestMethod -Uri "$apiUrl/api/transformations" -Method Get
    $transCount = $transformations.Count
    Write-Host "   [OK] Transformations API: OK ($transCount transformations found)" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Transformations API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Check component file
Write-Host "`n3. Checking component file..." -ForegroundColor Yellow
$componentFile = "frontend\src\components\source\SourceDetailContent.tsx"

if (Test-Path $componentFile) {
    Write-Host "   [OK] Component file exists" -ForegroundColor Green
    
    $content = Get-Content $componentFile -Raw
    
    # Check for key features
    $hasTabs = $content -match 'TabsList'
    $hasInsights = $content -match 'value="insights"'
    $hasDetails = $content -match 'value="details"'
    $hasFetchInsights = $content -match 'fetchInsights'
    $hasCreateInsight = $content -match 'createInsight'
    
    if ($hasTabs) {
        Write-Host "   [OK] Tabs component found" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Tabs component NOT found" -ForegroundColor Red
    }
    
    if ($hasInsights) {
        Write-Host "   [OK] Insights tab found" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Insights tab NOT found" -ForegroundColor Red
    }
    
    if ($hasDetails) {
        Write-Host "   [OK] Details tab found" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Details tab NOT found" -ForegroundColor Red
    }
    
    if ($hasFetchInsights) {
        Write-Host "   [OK] fetchInsights function found" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] fetchInsights function NOT found" -ForegroundColor Red
    }
    
    if ($hasCreateInsight) {
        Write-Host "   [OK] createInsight function found" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] createInsight function NOT found" -ForegroundColor Red
    }
} else {
    Write-Host "   [ERROR] Component file NOT found" -ForegroundColor Red
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  Manual Verification Steps" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`nPlease do the following:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000 in your browser"
Write-Host "2. Navigate to a source (click on any uploaded PDF)"
Write-Host "3. Look for THREE tabs: Content, Insights, Details"
Write-Host "4. Click on the 'Insights' tab"
Write-Host ""
Write-Host "What do you see?" -ForegroundColor Cyan
Write-Host "  - Are the three tabs visible?"
Write-Host "  - Can you click on the 'Insights' tab?"
Write-Host "  - What happens when you click it?"
Write-Host ""

Write-Host "`nIf you do not see the tabs:" -ForegroundColor Yellow
Write-Host "1. Open browser DevTools (F12)"
Write-Host "2. Check the Console for any errors"
Write-Host "3. Take a screenshot and share it"
