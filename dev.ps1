# Morocco360 - unified dev starter
# Usage:
#   .\dev.ps1              - lint + test + seed + start servers
#   .\dev.ps1 -SkipLint    - skip lint
#   .\dev.ps1 -SkipTest    - skip tests
#   .\dev.ps1 -SkipSeed    - skip seed
#   .\dev.ps1 -ServersOnly - jump straight to starting servers

param(
    [switch]$SkipLint,
    [switch]$SkipTest,
    [switch]$SkipSeed,
    [switch]$ServersOnly
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# Read API port from api/.env (fallback 4000)
$apiPort = "4000"
$apiEnvFile = Join-Path $root "api\.env"
if (Test-Path $apiEnvFile) {
    $match = Select-String -Path $apiEnvFile -Pattern "^PORT=(.+)" | Select-Object -First 1
    if ($match) { $apiPort = $match.Matches[0].Groups[1].Value.Trim() }
}

# Read web port from web/package.json dev script (fallback 4001)
$webPort = "4001"
$webPkg = Join-Path $root "web\package.json"
if (Test-Path $webPkg) {
    $match = Select-String -Path $webPkg -Pattern "--port\s+(\d+)" | Select-Object -First 1
    if ($match) { $webPort = $match.Matches[0].Groups[1].Value.Trim() }
}

function Step { param($msg) Write-Host "`n>>> $msg" -ForegroundColor Cyan }
function Ok   { param($msg) Write-Host "[OK]   $msg" -ForegroundColor Green }
function Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red; exit 1 }
function Run  { param($dir, $cmd)
    Push-Location $dir
    try {
        Invoke-Expression $cmd
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
    } catch {
        Pop-Location
        Fail "Command failed in $dir`: $cmd"
    }
    Pop-Location
}

Write-Host ""
Write-Host "  Morocco360 - Dev Starter" -ForegroundColor Magenta
Write-Host "  API  ->  http://localhost:$apiPort"
Write-Host "  Web  ->  http://localhost:$webPort"
Write-Host ""

# Dependencies
Step "Checking dependencies..."
if (-not (Test-Path (Join-Path $root "api\node_modules"))) {
    Write-Host "  Installing API deps..." -ForegroundColor Yellow
    Run "$root\api" "npm install"
}
if (-not (Test-Path (Join-Path $root "web\node_modules"))) {
    Write-Host "  Installing web deps..." -ForegroundColor Yellow
    Run "$root\web" "npm install"
}
Ok "Dependencies ready"

if (-not $ServersOnly) {

    # Lint
    if (-not $SkipLint) {
        Step "Linting..."
        Run "$root\api" "npm run lint"
        Ok "API lint passed"
        Run "$root\web" "npm run lint"
        Ok "Web lint passed"
    }

    # Tests
    if (-not $SkipTest) {
        Step "Running API tests..."
        Run "$root\api" "npm run test"
        Ok "API tests passed"
    }

    # Seed
    if (-not $SkipSeed) {
        Step "Seeding database..."
        Run "$root\api" "npm run seed"
        Ok "Database seeded"
    }
}

# Start servers
Step "Starting dev servers..."

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "& { `$host.UI.RawUI.WindowTitle = 'API :$apiPort'; Set-Location '$root\api'; npm run start:dev }"
)

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "& { `$host.UI.RawUI.WindowTitle = 'Web :$webPort'; Set-Location '$root\web'; npm run dev }"
)

Write-Host ""
Ok "Both servers launched in separate windows"
Write-Host "  API  ->  http://localhost:$apiPort" -ForegroundColor White
Write-Host "  Web  ->  http://localhost:$webPort" -ForegroundColor White
Write-Host ""