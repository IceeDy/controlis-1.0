COMPOSE ?= docker-compose
BACKEND_SERVICE ?= backend
POSTGRES_CONTAINER ?= controlis_postgres
POSTGRES_VOLUME ?= controlis_postgres_data

.PHONY: up down logs reset wait-db migrate seed

up:
	$(COMPOSE) up -d --build
	$(MAKE) wait-db
	$(COMPOSE) exec -T $(BACKEND_SERVICE) controlis-migrate
	$(COMPOSE) exec -T $(BACKEND_SERVICE) controlis-seed

wait-db:
	@echo "Aguardando PostgreSQL ficar saudável..."
	@attempt=0; \
	container_id=`$(COMPOSE) ps -q postgres`; \
	until [ -n "$$container_id" ] && [ "$$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' $$container_id 2>/dev/null || echo starting)" = "healthy" ]; do \
		attempt=`expr $$attempt + 1`; \
		if [ $$attempt -ge 30 ]; then \
			echo "PostgreSQL não ficou saudável a tempo."; \
			exit 1; \
		fi; \
		container_id=`$(COMPOSE) ps -q postgres`; \
		sleep 2; \
	done; \
	echo "PostgreSQL saudável."

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

reset:
	$(COMPOSE) down -v --remove-orphans
	docker volume rm -f $(POSTGRES_VOLUME) >/dev/null 2>&1 || true
	$(MAKE) up

migrate:
	$(COMPOSE) exec -T $(BACKEND_SERVICE) controlis-migrate

seed:
	$(COMPOSE) exec -T $(BACKEND_SERVICE) controlis-seed
