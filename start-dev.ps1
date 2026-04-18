$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root 'backend'
$mlPath = Join-Path $root 'ml-service'
$mockPath = Join-Path $root 'mock-platform-api'
$mobilePath = Join-Path $root 'mobile'
$pidFile = Join-Path $root '.dev-pids.json'

function Get-PreferredLanIp {
    $wifi = Get-NetIPConfiguration | Where-Object {
        $_.InterfaceAlias -eq 'Wi-Fi' -and
        $_.IPv4Address -ne $null -and
        $_.IPv4DefaultGateway -ne $null
    } | Select-Object -First 1

    if ($wifi) {
        return $wifi.IPv4Address.IPAddress
    }

    $fallback = Get-NetIPConfiguration | Where-Object {
        $_.IPv4Address -ne $null -and
        $_.IPv4DefaultGateway -ne $null
    } | Select-Object -First 1

    if ($fallback) {
        return $fallback.IPv4Address.IPAddress
    }

    return '127.0.0.1'
}

function Sync-MobileApiIp {
    param(
        [string]$ProjectRoot,
        [string]$IpAddress
    )

    $mobileDir = Join-Path $ProjectRoot 'mobile'
    $envPath = Join-Path $mobileDir '.env'

    $apiUrl = "http://${IpAddress}:3000/api"
    $mockUrl = "http://${IpAddress}:3001"

    "API_BASE_URL=$apiUrl`nMOCK_PLATFORM_API_URL=$mockUrl" | Set-Content -Path $envPath -Encoding UTF8

    Write-Host "Mobile API target synced to $IpAddress"
}

function Start-ToolProcess {
    param(
        [string]$Name,
        [string]$WorkingDir,
        [string]$Command
    )

    $proc = Start-Process -FilePath 'powershell' -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        "Set-Location '$WorkingDir'; $Command"
    ) -PassThru

    [PSCustomObject]@{
        name = $Name
        id = $proc.Id
    }
}

Write-Host 'Starting docker services (postgres, redis)...'
Set-Location $root

$lanIp = Get-PreferredLanIp
Sync-MobileApiIp -ProjectRoot $root -IpAddress $lanIp

docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Docker services failed to start. Start Docker Desktop and rerun .\start-dev.ps1'
    exit 1
}

$redisReady = (Test-NetConnection -ComputerName 127.0.0.1 -Port 6379 -WarningAction SilentlyContinue).TcpTestSucceeded
if (-not $redisReady) {
    Write-Host 'Redis is not reachable on 127.0.0.1:6379. Ensure Docker is running and try again.'
    exit 1
}

$postgresReady = (Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded
if (-not $postgresReady) {
    Write-Host 'Postgres is not reachable on 127.0.0.1:5432. Ensure Docker is running and try again.'
    exit 1
}

Write-Host 'Starting backend, ml-service, mock-platform-api, and mobile...'
$procs = @()
$procs += Start-ToolProcess -Name 'backend' -WorkingDir $backendPath -Command 'npm run dev'
$procs += Start-ToolProcess -Name 'ml-service' -WorkingDir $mlPath -Command 'if (Test-Path .venv\Scripts\Activate.ps1) { & .venv\Scripts\Activate.ps1 }; uvicorn main:app --host 0.0.0.0 --port 8001 --reload'
$procs += Start-ToolProcess -Name 'mock-platform-api' -WorkingDir $mockPath -Command 'npm start'
$procs += Start-ToolProcess -Name 'mobile' -WorkingDir $mobilePath -Command 'npm start'

$procs | ConvertTo-Json | Set-Content -Path $pidFile -Encoding UTF8

Write-Host 'Dev stack started.'
Write-Host "Process list saved to $pidFile"
Write-Host 'To stop all started processes, run: .\stop-dev.ps1'
