# Loads .env (if present) into every recipe.
SHELL := /bin/bash
ENV := set -a; [ -f .env ] && . ./.env; set +a;

.PHONY: deps dev migrate migrate-down migrate-status content seed-demo seed-demo-remove seed-roadmap admin coupon test sqlc fmt

deps:            ## start Postgres, Redis, Mailpit
	docker compose -f ../../compose.yaml up -d --wait

dev: migrate content  ## run API + worker in one process
	$(ENV) go run ./cmd/api -mode=all

migrate:
	$(ENV) go run ./cmd/migrate up

content:         ## sync lesson metadata (ids, XP, sections) from ../../content into Postgres
	$(ENV) go run ./cmd/contentsync -dir ../../content

seed-demo:       ## load demo companies + jobs for the careers portal (idempotent)
	$(ENV) go run ./cmd/seed -careers

admin:           ## make EMAIL an admin (creates the account if missing; asks for its password)
	$(ENV) go run ./cmd/admin -email "$(EMAIL)" $(if $(REVOKE),-revoke)

seed-roadmap:    ## load the starter roadmap (keeps items you already edited)
	$(ENV) go run ./cmd/seed -roadmap

seed-demo-remove: ## delete all demo companies + jobs
	$(ENV) go run ./cmd/seed -careers -remove

coupon:          ## create/update a coupon: make coupon CODE=EID20 PERCENT=20 [MAX=100] [DAYS=7] [PLANS=yearly]
	$(ENV) go run ./cmd/seed -coupon "$(CODE)" -percent "$(or $(PERCENT),0)" -max "$(or $(MAX),0)" -days "$(or $(DAYS),0)" -plans "$(PLANS)"

migrate-down:
	$(ENV) go run ./cmd/migrate down

migrate-status:
	$(ENV) go run ./cmd/migrate status

test:
	go test -race ./...

sqlc:            ## regenerate type-safe queries from db/queries/*.sql
	docker run --rm --user $$(id -u):$$(id -g) -v "$$PWD":/src -w /src sqlc/sqlc:1.29.0 generate

fmt:
	gofmt -w .
