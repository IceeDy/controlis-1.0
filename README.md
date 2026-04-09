# Controlis

Aplicação full-stack do MVP do Controlis, um SaaS para pequenos comércios com foco em produtos, estoque, vendas, dashboard executivo e estrutura multiempresa.

O repositório agora também inclui a base do backend em `backend/`, usando FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL e JWT.

## Stack

- Next.js 16 com App Router
- TypeScript
- Tailwind CSS 4
- Axios
- React Hook Form
- Zod
- Lucide React
- Zustand

## Funcionalidades do MVP

- Login com autenticação real via backend FastAPI
- Layout autenticado com sidebar responsiva, header e tema claro/escuro
- Dashboard com indicadores, estoque crítico, mais vendidos e resumo operacional
- Gestão de produtos com busca, filtro, criação, edição e exclusão
- Controle de estoque com histórico e movimentações manuais
- Registro de vendas com múltiplos itens e cálculo automático
- Configurações da empresa com contexto multi-tenant

## Estrutura

```text
src/
	app/
		login/
		(private)/
			dashboard/
			products/
			inventory/
			sales/
			settings/
	components/
		dashboard/
		forms/
		inventory/
		layout/
		products/
		providers/
		sales/
		settings/
		ui/
	hooks/
	lib/
	mocks/
	schemas/
	services/
	store/
	types/
```

## Rodando localmente

```bash
npm install
npm run dev
```

Aplicação disponível em `http://localhost:3000`.

## Credenciais iniciais

- Email: `admin@controlis.com`
- Senha: `admin123`

## Integração frontend/backend

O frontend já consome a API real do backend. Os endpoints principais incluem:

- `/auth/login`
- `/dashboard/summary`
- `/products`
- `/inventory/movements`
- `/sales`
- `/settings/company`

O cliente HTTP envia bearer token, restaura sessão automaticamente e protege as rotas privadas.

## Backend

O backend do MVP está em `backend/` e possui documentação própria em `backend/README.md`, com estrutura de app, serviços, routers, models e configuração de migrations com Alembic.

Fluxo básico do backend:

```bash
cd backend
pip install -e .
controlis-migrate
python -m scripts.seed
uvicorn app.main:app --reload
```

Fluxo com Docker Compose:

```bash
cd backend
docker-compose up -d
docker-compose exec backend controlis-migrate
docker-compose exec backend controlis-seed
```

Bootstrap completo com Makefile:

```bash
cd backend
make up
```

Bootstrap completo no Windows PowerShell:

```powershell
cd backend
.\bootstrap.ps1 up
```

Pré-requisito no Windows: Docker Desktop instalado e em execução.

Reset completo do backend Docker:

```bash
cd backend
make reset
```

Reset completo no Windows PowerShell:

```powershell
cd backend
.\bootstrap.ps1 reset
```

Acesso local do backend:

- Docs: `http://localhost:8000/docs`
- Admin inicial: `admin@controlis.com` / `admin123`

## CI do backend

O workflow `.github/workflows/backend-ci.yml` valida o backend automaticamente em `push` e `pull_request` com PostgreSQL real no GitHub Actions, executando migration segura, seed e `pytest -v`, incluindo os testes de integração e o teste de sanidade de migrations.
