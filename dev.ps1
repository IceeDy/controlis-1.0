param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

if ($FrontendOnly -and $BackendOnly) {
    throw "Use apenas um entre -FrontendOnly e -BackendOnly."
}

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $rootPath "backend"
$backendBootstrap = Join-Path $backendPath "bootstrap.ps1"

function Assert-CommandAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandName,
        [Parameter(Mandatory = $true)]
        [string]$InstallHint
    )

    if ($null -eq (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "$CommandName não foi encontrado no PATH. $InstallHint"
    }
}

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = $rootPath
    )

    Push-Location $WorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao executar: $FilePath $($Arguments -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

if (-not $FrontendOnly) {
    if (-not (Test-Path $backendBootstrap)) {
        throw "Arquivo não encontrado: $backendBootstrap"
    }

    Write-Host "[controlis] Subindo backend..." -ForegroundColor Cyan
    Invoke-Step -FilePath $backendBootstrap -Arguments @("up") -WorkingDirectory $backendPath
    Write-Host "[controlis] Backend disponível em http://localhost:8000/docs" -ForegroundColor Green
}

if (-not $BackendOnly) {
    Assert-CommandAvailable -CommandName "npm" -InstallHint "Instale o Node.js antes de iniciar o frontend."

    if ((-not $SkipInstall) -and -not (Test-Path (Join-Path $rootPath "node_modules"))) {
        Write-Host "[controlis] Instalando dependências do frontend..." -ForegroundColor Cyan
        Invoke-Step -FilePath "npm" -Arguments @("install") -WorkingDirectory $rootPath
    }

    Write-Host "[controlis] Iniciando frontend em http://localhost:3000..." -ForegroundColor Cyan
    Invoke-Step -FilePath "npm" -Arguments @("run", "dev") -WorkingDirectory $rootPath
}