$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $repoRoot 'apps/server/.env'))) { throw 'Run scripts/setup-local.ps1 first.' }
$bunCommand = Get-Command bun -ErrorAction SilentlyContinue
$bunPath = if ($bunCommand) { $bunCommand.Source } else { Join-Path $env:LOCALAPPDATA 'LabasPreview/Bun/bin/bun.exe' }
if (-not (Test-Path $bunPath)) { throw 'Bun is missing.' }
$env:Path = "$(Split-Path $bunPath -Parent);$env:Path"
$env:BUN_RUNTIME_TRANSPILER_CACHE_PATH = '0'
$env:RAYON_NUM_THREADS = '2'
if (-not $env:NODE_OPTIONS) { $env:NODE_OPTIONS = '--max-old-space-size=512' }
Push-Location $repoRoot
try {
    & docker compose --env-file deploy/.env.local -f deploy/compose.local.yml up -d --wait
    if ($LASTEXITCODE -ne 0) { throw 'Local Docker services failed to start.' }
    & $bunPath run dev -- --env-mode=loose
    if ($LASTEXITCODE -ne 0) { throw 'Local application startup failed.' }
} finally { Pop-Location }
