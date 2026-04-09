param(
    [Parameter(Position = 0)]
    [ValidateSet("up", "down", "logs", "reset", "migrate", "seed", "wait-db")]
    [string]$Command = "up"
)

$ErrorActionPreference = "Stop"

$ComposeArgs = @("compose")
$BackendService = "backend"
$PostgresService = "postgres"
$PostgresVolume = "controlis_postgres_data"

function Assert-DockerAvailable {
    $dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
    if ($null -eq $dockerCommand) {
        throw @"
Docker não foi encontrado no PATH.

No Windows, instale e inicie o Docker Desktop:
https://www.docker.com/products/docker-desktop/

Depois de instalar, feche e abra o PowerShell novamente e execute:
  .\bootstrap.ps1 up
"@
    }

    & docker version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw @"
O comando Docker existe, mas o daemon não está acessível.

Verifique se o Docker Desktop está aberto e totalmente inicializado.
Depois execute novamente:
  .\bootstrap.ps1 up
"@
    }

    & docker compose version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw @"
O plugin 'docker compose' não está disponível.

Atualize o Docker Desktop ou habilite o Docker Compose V2.
"@
    }
}

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & docker @ComposeArgs @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao executar: docker $($ComposeArgs -join ' ') $($Arguments -join ' ')"
    }
}

function Get-PostgresContainerId {
    $containerId = (& docker @ComposeArgs ps -q $PostgresService).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Não foi possível obter o container do PostgreSQL."
    }

    return $containerId
}

function Wait-Db {
    Write-Host "Aguardando PostgreSQL ficar saudável..."

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $containerId = Get-PostgresContainerId

        if ($containerId) {
            $healthStatus = (& docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}" $containerId 2>$null).Trim()
            if ($LASTEXITCODE -eq 0 -and $healthStatus -eq "healthy") {
                Write-Host "PostgreSQL saudável."
                return
            }
        }

        Start-Sleep -Seconds 2
    }

    throw "PostgreSQL não ficou saudável dentro do tempo esperado."
}

function Invoke-Migrate {
    Invoke-Compose -Arguments @("exec", "-T", $BackendService, "controlis-migrate")
}

function Invoke-Seed {
    Invoke-Compose -Arguments @("exec", "-T", $BackendService, "controlis-seed")
}

Assert-DockerAvailable

switch ($Command) {
    "up" {
        Invoke-Compose -Arguments @("up", "-d", "--build")
        Wait-Db
        Invoke-Migrate
        Invoke-Seed
    }
    "down" {
        Invoke-Compose -Arguments @("down")
    }
    "logs" {
        Invoke-Compose -Arguments @("logs", "-f")
    }
    "reset" {
        Invoke-Compose -Arguments @("down", "-v", "--remove-orphans")
        & docker volume rm -f $PostgresVolume | Out-Null
        Invoke-Compose -Arguments @("up", "-d", "--build")
        Wait-Db
        Invoke-Migrate
        Invoke-Seed
    }
    "migrate" {
        Invoke-Migrate
    }
    "seed" {
        Invoke-Seed
    }
    "wait-db" {
        Wait-Db
    }
}