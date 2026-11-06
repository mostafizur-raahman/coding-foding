# Coding Foding — run everything from the repo root.
#   make dev    → Docker deps + migrations + API (pretty logs) + web, together
#   make help   → every target
SHELL := /bin/bash
.SHELLFLAGS := -o pipefail -c
.DEFAULT_GOAL := help

API := $(MAKE) --no-print-directory -C apps/api

# One readable line per API log entry; falls back to raw JSON when jq is missing.
PRETTY := $(shell command -v jq >/dev/null && echo "jq --unbuffered -rR 'fromjson? | \"\\(.time[11:19]) \\(.level) \\(.msg) \\(.method // \"\") \\(.route // \"\") \\(.status // \"\") \\(.err // \"\")\"'" || echo cat)

.PHONY: help dev deps deps-down api api-raw web clean-web migrate content seed-demo seed-roadmap admin coupon test lint check

help: ## show this help
	@grep -hE '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

dev: deps migrate ## start everything: Docker deps, migrations, API + web (Ctrl+C stops both)
	@$(MAKE) --no-print-directory -j2 api web

deps: ## start Postgres, Redis and Mailpit (Docker)
	@$(API) deps

deps-down: ## stop the Docker deps (data is kept)
	docker compose -f compose.yaml down

migrate: ## apply database migrations
	@$(API) migrate

content: ## sync lesson metadata (ids, XP, sections) into the database
	@$(API) content

seed-demo: ## load demo companies + jobs and the 12 starter reviews
	@$(API) seed-demo

admin: ## make EMAIL an admin, creating the account if needed: make admin EMAIL=you@x.com [REVOKE=1]
	@$(API) admin EMAIL="$(EMAIL)" REVOKE="$(REVOKE)"

seed-roadmap: ## load the starter roadmap (keeps items you already edited)
	@$(API) seed-roadmap

coupon: ## create/update a coupon: make coupon CODE=EID20 PERCENT=20 [MAX=100] [DAYS=7] [PLANS=yearly]
	@$(API) coupon CODE="$(CODE)" PERCENT="$(PERCENT)" MAX="$(MAX)" DAYS="$(DAYS)" PLANS="$(PLANS)"

api: ## run the Go API + worker on :8080 with readable logs
	@$(API) dev 2>&1 | $(PRETTY)

api-raw: ## run the Go API with raw JSON logs
	@$(API) dev

web: ## run the Next.js dev server on :3000
	npm run dev

clean-web: ## delete the Next.js dev cache (apps/web/.next)
	rm -rf apps/web/.next

test: ## run backend and frontend tests
	@$(API) test
	npm run test

lint: ## typecheck + lint the web app, vet the API
	npm run typecheck
	npm run lint
	cd apps/api && go vet ./...

check: lint test ## everything CI would run
