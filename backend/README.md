# Controlis Backend

Base do backend do MVP Controlis usando FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL e autenticação JWT.

## Estrutura

```text
backend/
  app/
    api/
      v1/
        routers/
    core/
    db/
    dependencies/
    models/
    schemas/
    services/
    main.py
  alembic/
  alembic.ini
  pyproject.toml
```

## Configuração

1. Crie o arquivo `.env` a partir de `.env.example`.
2. Ajuste a `DATABASE_URL` para o PostgreSQL.
3. Instale as dependências.
4. Rode a migration inicial com Alembic.
5. Execute o seed inicial.
6. Suba a API com Uvicorn.

## Comandos

```bash
pip install -e .
controlis-migrate
python -m scripts.seed
# ou
controlis-seed
uvicorn app.main:app --reload
```

## Testes automatizados

Os testes de integração usam o FastAPI em processo e o PostgreSQL real configurado no `DATABASE_URL`. Não usam SQLite nem mocks para as regras principais.

Instale as dependências de teste:

```bash
pip install -e ".[test]"
```

Com o PostgreSQL do `docker-compose.yml` ativo e as migrations aplicadas, execute:

```bash
pytest -v
```

Opcionalmente:

```bash
pytest --maxfail=1 --disable-warnings
```

Os testes ficam em `tests/` e criam tenants isolados para validar autenticação, produtos, estoque, vendas, dashboard e segregação multi-tenant.

O arquivo `tests/test_migrations.py` valida o fluxo operacional de migrations com PostgreSQL real, cobrindo banco vazio, rerun idempotente, schema existente sem `alembic_version` e reset completo com seed.

## CI

O workflow do GitHub Actions fica em `.github/workflows/backend-ci.yml` e roda em `push` e `pull_request` que alterem o backend.

Ele executa, em ordem:

- checkout do repositório
- setup do Python 3.12 com cache de dependências
- provisionamento de PostgreSQL 15 como service do GitHub Actions
- espera ativa até o banco ficar pronto
- `controlis-migrate`
- `controlis-seed`
- `pytest -v`

No CI, os testes de migration usam `CONTROLIS_TEST_COMMAND_MODE=local` para executar `controlis-migrate` e `controlis-seed` por subprocess diretamente no runner, mantendo isolamento por banco temporário sem depender de `docker compose`.

## Docker Compose

O arquivo [docker-compose.yml](docker-compose.yml) sobe o PostgreSQL e o backend FastAPI na mesma rede do Compose, usando o hostname `postgres` na `DATABASE_URL`.

Pré-requisito no Windows: Docker Desktop instalado, aberto e com o comando `docker` disponível no PATH.

## Bootstrap completo

O [Makefile](Makefile) permite subir o ambiente inteiro com um único comando, incluindo Compose, espera do banco, migration e seed.

No Windows, onde `make` normalmente não está disponível por padrão, use o script [bootstrap.ps1](bootstrap.ps1).

### Subir tudo

```bash
make up
```

No Windows PowerShell:

```powershell
.\bootstrap.ps1 up
```

Se o PowerShell indicar que `docker` não foi encontrado, instale e abra o Docker Desktop antes de executar o bootstrap.

Esse comando executa:

- `docker-compose up -d --build`
- espera o PostgreSQL ficar saudável
- `controlis-migrate`
- `controlis-seed`

### Derrubar ambiente

```bash
make down
```


No Windows PowerShell:

```powershell
.\bootstrap.ps1 down
```

### Ver logs

```bash
make logs
```

No Windows PowerShell:

```powershell
.\bootstrap.ps1 logs
```

### Reset completo

```bash
make reset
```

No Windows PowerShell:

```powershell
.\bootstrap.ps1 reset
```

Esse fluxo remove containers, remove o volume persistente do PostgreSQL e sobe tudo novamente do zero.

### Somente migration e seed

```powershell
.\bootstrap.ps1 migrate
.\bootstrap.ps1 seed
```

### Subir os serviços

```bash
docker-compose up -d
```

### Aplicar migration

```bash
docker-compose exec backend controlis-migrate
```

### Rodar seed inicial

```bash
docker-compose exec backend controlis-seed
```

### Endpoints expostos

- Backend: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

### Persistência

Os dados do PostgreSQL ficam no volume nomeado `controlis_postgres_data`.

## Migration inicial

A revisão inicial já foi criada em `alembic/versions/20260406_0001_initial_schema.py` e contempla:

- tabelas `tenants`, `users`, `products`, `inventory_movements`, `sales`, `sale_items` e `company_settings`
- foreign keys com `ondelete`
- índices em colunas críticas como `tenant_id`, `product_id`, `sale_id`, `email` e `sale_date`
- constraints de integridade para valores inválidos de preço, quantidade e estoque
- timestamps com `server_default=now()`

Para aplicar:

```bash
controlis-migrate
```

## Seed inicial

O seed está em `scripts/seed.py` e é idempotente. Ele cria ou atualiza:

- 1 tenant padrão
- 1 registro de `company_settings` vinculado a esse tenant
- 1 usuário admin vinculado ao mesmo tenant

Credenciais iniciais:

- Email: `admin@controlis.com`
- Senha: `admin123`

O script valida o vínculo do usuário com o tenant padrão para evitar mistura de dados entre empresas.

Para executar:

```bash
python -m scripts.seed
# ou
controlis-seed
```

## Endpoints principais

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/summary`
- `GET|POST /api/v1/products`
- `GET /api/v1/products/{product_id}`
- `PUT /api/v1/products/{product_id}`
- `DELETE /api/v1/products/{product_id}`
- `GET|POST /api/v1/inventory/movements`
- `GET /api/v1/inventory/balances`
- `GET|POST /api/v1/sales`
- `GET /api/v1/sales/{sale_id}`
- `GET|PUT /api/v1/settings/company`

## Multi-tenant

Todos os endpoints autenticados utilizam o `tenant_id` do usuário presente no JWT para isolar os dados operacionais.
