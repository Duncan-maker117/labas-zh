# Creates this project's isolated local development services. Does not configure production.
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$composeFile = Join-Path $repoRoot 'deploy/compose.local.yml'
$composeEnv = Join-Path $repoRoot 'deploy/.env.local'
$serverEnv = Join-Path $repoRoot 'apps/server/.env'
$webEnv = Join-Path $repoRoot 'apps/web/.env'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function New-LocalSecret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}

$bunCommand = Get-Command bun -ErrorAction SilentlyContinue
$bunPath = if ($bunCommand) { $bunCommand.Source } else { Join-Path $env:LOCALAPPDATA 'LabasPreview/Bun/bin/bun.exe' }
if (-not (Test-Path $bunPath)) { throw 'Bun is missing. Install the version from package.json first.' }
$env:Path = "$(Split-Path $bunPath -Parent);$env:Path"
$env:BUN_RUNTIME_TRANSPILER_CACHE_PATH = '0'

if (-not (Test-Path $composeEnv)) {
    if (Test-Path $serverEnv) { throw 'Existing server .env found; refusing to generate mismatched database credentials.' }
    [IO.File]::WriteAllText($composeEnv, "LABAS_DB_PASSWORD=$(New-LocalSecret)`n", $utf8)
}
$passwordLine = Get-Content $composeEnv | Where-Object { $_ -match '^LABAS_DB_PASSWORD=' }
if (@($passwordLine).Count -ne 1) { throw 'Expected exactly one LABAS_DB_PASSWORD entry.' }
$dbPassword = $passwordLine.Substring('LABAS_DB_PASSWORD='.Length)
if ($dbPassword -notmatch '^[a-f0-9]{64}$') { throw 'Invalid local database password format.' }
$databaseUrl = "postgresql://labas_app:${dbPassword}@127.0.0.1:15432/labas_local"

if (Test-Path $serverEnv) {
    $databaseLine = Get-Content $serverEnv | Where-Object { $_ -match '^DATABASE_URL=' }
    if ($databaseLine -ne "DATABASE_URL=$databaseUrl") { throw 'Server .env is not this isolated local database. No database command was run.' }
} else {
    $contents = @"
DATABASE_URL=$databaseUrl
REDIS_URL=redis://127.0.0.1:16380
BETTER_AUTH_SECRET=$(New-LocalSecret)
BETTER_AUTH_URL=http://127.0.0.1:3000
CORS_ORIGIN=http://127.0.0.1:3001
API_KEY_ENCRYPTION_KEY=$(New-LocalSecret)
NODE_ENV=development
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_FROM=Labas Local <noreply@labas.local>
FREE_CREDITS_ENABLED=false
TURNSTILE_DISABLED=false
"@
    [IO.File]::WriteAllText($serverEnv, $contents + "`n", $utf8)
}
if (-not (Test-Path $webEnv)) {
    [IO.File]::WriteAllText($webEnv, "VITE_SERVER_URL=http://127.0.0.1:3000`nVITE_SITE_URL=http://127.0.0.1:3001`nVITE_BLOG_ENABLED=false`nVITE_GOOGLE_AUTH_ENABLED=false`n", $utf8)
}

Push-Location $repoRoot
try {
    if (-not (Test-Path 'node_modules')) {
        & $bunPath install --frozen-lockfile --backend copyfile --cache-dir (Join-Path $repoRoot '.cache/bun')
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
    }
    & docker compose --env-file $composeEnv -f $composeFile up -d --wait
    if ($LASTEXITCODE -ne 0) { throw 'Local Docker services failed to start.' }
    # Drizzle reads apps/server/.env through packages/db/src/database-url.ts.
    if ($env:DATABASE_URL -and $env:DATABASE_URL -ne $databaseUrl) { throw 'An unrelated DATABASE_URL is set in this shell. No migration was run.' }
    & $bunPath run db:migrate
    if ($LASTEXITCODE -ne 0) { throw 'Local database migration failed.' }
    & $bunPath run db:seed
    if ($LASTEXITCODE -ne 0) { throw 'Local reference data seed failed.' }
    Write-Host 'Local database, queue, and mail inbox are ready. Run scripts/start-local.ps1 next.'
    Write-Host 'Web: http://127.0.0.1:3001 | Local mail inbox: http://127.0.0.1:8025'
} finally { Pop-Location }
