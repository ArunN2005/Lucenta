$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root '.dev-pids.json'

if (-not (Test-Path $pidFile)) {
    Write-Host 'No PID file found. Nothing to stop.'
    exit 0
}

$items = Get-Content $pidFile | ConvertFrom-Json

foreach ($item in $items) {
    try {
        $proc = Get-Process -Id $item.id -ErrorAction Stop
        Stop-Process -Id $proc.Id -Force
        Write-Host "Stopped $($item.name) (PID $($item.id))"
    } catch {
        Write-Host "Process for $($item.name) already stopped (PID $($item.id))"
    }
}

Remove-Item $pidFile -Force

Set-Location $root
docker compose down
Write-Host 'Docker services stopped (postgres, redis).'
