# Coding Foding API

Go 1.23+ · chi · PostgreSQL 16 (pgx + pgxpool + sqlc) · Redis 7 (Asynq jobs) · design: [`docs/BACKEND_DESIGN.md`](../../docs/BACKEND_DESIGN.md)

## Run locally

```bash
docker compose -f ../../compose.yaml up -d --wait   # Postgres :5433, Redis :6380, Mailpit :8025
cp .env.example .env                                # then set JWT_SECRET (openssl rand -base64 48)
set -a; . ./.env; set +a
go run ./cmd/migrate up
go run ./cmd/api -mode=all                          # API :8080 + worker; metrics :9090
```

Emails (verification, password reset) land in Mailpit: <http://localhost:8025>.
With `make` installed: `make deps`, `make dev`, `make test`, `make sqlc`.

## API reference

**Swagger UI:** <http://localhost:8080/api/docs> (also <http://localhost:3000/api/docs> through the web app, where
requests are same-origin so the login/refresh cookies work too). The spec is [`internal/transport/http/apidocs/openapi.yaml`](internal/transport/http/apidocs/openapi.yaml),
written by hand; `go test ./internal/transport/http/` fails when a route is added or removed without updating it.

Errors are always `{"error": {"code", "message", "request_id", "fields?"}}`. Roadmap how-to: [`docs/API.md`](../../docs/API.md).

## Tests

```bash
go test -race ./...
```
