# Local Login Test Script for Windows
# This script starts both servers and runs the login test

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 LOCAL LOGIN FUNCTIONALITY TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is already running
Write-Host "🔍 Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Backend is already running" -ForegroundColor Green
    $backendRunning = $true
} catch {
    Write-Host "❌ Backend is not running" -ForegroundColor Red
    $backendRunning = $false
}

# Check if frontend is already running
Write-Host "🔍 Checking if frontend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Frontend is already running" -ForegroundColor Green
    $frontendRunning = $true
} catch {
    Write-Host "❌ Frontend is not running" -ForegroundColor Red
    $frontendRunning = $false
}

# Start backend if not running
if (-not $backendRunning) {
    Write-Host ""
    Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
    Write-Host "   Please start the backend manually in a separate terminal:" -ForegroundColor Yellow
    Write-Host "   cd trevnoctilla-backend" -ForegroundColor Cyan
    Write-Host "   python app.py" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Or set DATABASE_URL environment variable if needed:" -ForegroundColor Yellow
    Write-Host "   `$env:DATABASE_URL='postgresql://...'" -ForegroundColor Cyan
    Write-Host ""
}

# Start frontend if not running
if (-not $frontendRunning) {
    Write-Host ""
    Write-Host "🚀 Starting frontend server..." -ForegroundColor Yellow
    Write-Host "   Please start the frontend manually in a separate terminal:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Cyan
    Write-Host ""
}

# Wait for user to start servers
if (-not $backendRunning -or -not $frontendRunning) {
    Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Yellow
    Write-Host "   Press Enter once both servers are running..." -ForegroundColor Yellow
    Read-Host
}

# Wait a bit more for servers to fully initialize
Write-Host ""
Write-Host "⏳ Waiting 5 seconds for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Run the test
Write-Host ""
Write-Host "🧪 Running login test..." -ForegroundColor Cyan
Write-Host ""

node test-login-local.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Test completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

