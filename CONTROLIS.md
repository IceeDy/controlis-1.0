# Controlis

Controlis é um SaaS de gestão operacional para pequenos comércios. O produto centraliza autenticação, cadastro de produtos, controle de estoque, registro de vendas e configurações da empresa em uma interface web única, com backend próprio e isolamento de dados por empresa.

## Objetivo do produto

O foco do Controlis é dar visibilidade rápida da operação comercial do dia a dia, reduzindo trabalho manual e concentrando as informações mais importantes em um dashboard e em fluxos simples de cadastro, movimentação e consulta.

## Público-alvo

- Pequenos varejos
- Lojas com operação simples de estoque e vendas
- Empresas que precisam separar dados por tenant ou unidade

## Principais funcionalidades do MVP

### 1. Autenticação e sessão

- Login com backend real via FastAPI
- Sessão com token JWT
- Proteção das rotas privadas
- Recuperação automática da sessão no frontend

### 2. Dashboard operacional

- Total vendido no dia
- Total vendido no mês
- Quantidade de vendas no mês
- Produtos com estoque crítico
- Lista de produtos mais vendidos
- Insights operacionais com base nos dados do tenant autenticado

### 3. Gestão de produtos

- Listagem de produtos
- Busca por nome
- Filtro por categoria
- Cadastro de novos produtos
- Edição de produto existente
- Exclusão de produto
- Controle de preço de venda, custo e estoque atual

### 4. Controle de estoque

- Consulta de saldo por produto
- Histórico de movimentações
- Registro manual de entrada
- Registro de ajuste de estoque
- Visualização do impacto das movimentações sobre o saldo atual

### 5. Registro de vendas

- Criação de vendas com múltiplos itens
- Cálculo de subtotal por item e total da venda
- Consulta de vendas registradas
- Detalhamento individual de cada venda
- Filtro por período

### 6. Configurações da empresa

- Edição de nome da empresa
- Segmento de atuação
- Email e telefone
- Preferência de tema
- Preferência de dashboard compacto por tenant

### 7. Arquitetura multiempresa

- Isolamento de dados por `tenant_id`
- Endpoints autenticados operando no contexto do usuário logado
- Separação de produtos, estoque, vendas e configurações por empresa

## Como o sistema está organizado

### Frontend

Aplicação em Next.js com App Router, TypeScript, Tailwind CSS, React Hook Form, Zod e Zustand.

Areas principais da interface:

- `dashboard`
- `products`
- `inventory`
- `sales`
- `settings`
- `login`

### Backend

API em FastAPI com SQLAlchemy 2.x, Alembic, PostgreSQL e autenticação JWT.

Domínios principais expostos pela API:

- autenticação
- dashboard
- produtos
- estoque
- vendas
- configurações da empresa

## Endpoints principais do MVP

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/dashboard/summary`
- `GET|POST /api/v1/products`
- `PUT|DELETE /api/v1/products/{product_id}`
- `GET|POST /api/v1/inventory/movements`
- `GET /api/v1/inventory/balances`
- `GET|POST /api/v1/sales`
- `GET /api/v1/sales/{sale_id}`
- `GET|PUT /api/v1/settings/company`

## Resumo executivo

Hoje o Controlis já entrega a base de um ERP leve para operação comercial: autentica usuários, separa dados por empresa, mostra indicadores de negócio, controla estoque, organiza produtos, registra vendas e mantém as configurações essenciais da empresa em uma aplicação full-stack única.