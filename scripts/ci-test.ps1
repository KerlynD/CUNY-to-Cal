Write-Host "Testing CI/CD Pipeline Locally" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

Write-Host "Installing dependencies..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Write-Host "Found package-lock.json, using npm ci" -ForegroundColor Green
    npm ci
} else {
    Write-Host "No package-lock.json found, using npm install" -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Running type check..." -ForegroundColor Yellow
npm run type-check

Write-Host ""
Write-Host "Running linter..." -ForegroundColor Yellow
npm run lint

Write-Host ""
Write-Host "Running unit tests..." -ForegroundColor Yellow
npm test

Write-Host ""
Write-Host "Running e2e tests..." -ForegroundColor Yellow
npm run test:e2e

Write-Host ""
Write-Host "Building extension..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Creating zip package..." -ForegroundColor Yellow
npm run zip

Write-Host ""
Write-Host "All CI/CD steps completed successfully!" -ForegroundColor Green
Write-Host "Ready for deployment!" -ForegroundColor Green