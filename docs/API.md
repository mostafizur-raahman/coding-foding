# Coding Foding API

**Every endpoint is in Swagger UI:** <http://localhost:8080/api/docs> (or <http://localhost:3000/api/docs>).
Log in with `POST /auth/login`, press **Authorize**, paste the `access_token`, and try any request from the page.
The spec lives at [`apps/api/internal/transport/http/apidocs/openapi.yaml`](../apps/api/internal/transport/http/apidocs/openapi.yaml).

This file is the longer how-to for managing the roadmap.

## Basics

- **Base URL:** `http://localhost:8080/api/v1` locally. The web app proxies `/api/v1/*` to the API, so
  `http://localhost:3000/api/v1` works too.
- **Bodies:** JSON in, JSON out. Unknown fields are rejected; a body is at most 1 MiB.
- **Auth:** `Authorization: Bearer <access_token>`. Get a token from `POST /auth/login`
  (`{email, password}` → `access_token`, valid 15 min).
- **Admin routes** (`/admin/*`) need a user whose `role` is `admin`. No UI grants it yet, so set it in the database:

  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
  ```

  Log in again after the change, because the role is baked into the access token.

- **Errors** always look like this:

  ```json
  { "error": { "code": "invalid_stage", "message": "stage must be one of shipped, next, horizon, plan", "request_id": "…", "fields": { } } }
  ```

  | Status | When |
  |---|---|
  | 401 | missing or expired token |
  | 403 | logged in, but not an admin |
  | 404 | unknown id |
  | 409 | conflict (e.g. `slug_taken`) |
  | 422 | invalid input (`code` says which rule; `fields` lists struct-level failures) |
  | 429 | rate limited |

---

## Roadmap

The home page shows four columns, left to right:

| `stage` | Column | Meaning |
|---|---|---|
| `shipped` | Shipped | Already live. Shows the ship date and an optional link. |
| `next` | Next | Coming in the next few weeks. May show a progress bar. |
| `horizon` | Horizon | Coming in the next few months. |
| `plan` | Plan | Long-term plan. |

Within a column, items are sorted by `position` (low first).

### The item object

```json
{
  "id": "019a3f2c-7e1b-7c4e-9a51-3c2f8d1e0b44",
  "slug": "careers-portal",
  "stage": "shipped",
  "kind": "feature",
  "position": 2,
  "title": { "en": "Careers portal", "bn": "Careers portal" },
  "desc": { "en": "Browse jobs from Bangladeshi companies…", "bn": "Bangladesh এর company গুলোর job দেখো…" },
  "progress": null,
  "link": "/careers",
  "shipped_at": "2026-11-01T05:56:08.246972+06:00",
  "updated_at": "2026-11-01T05:56:08.246972+06:00"
}
```

| Field | Type | Rules |
|---|---|---|
| `slug` | string | **required**, unique, `^[a-z0-9-]{2,64}$`. A stable handle you choose. |
| `stage` | string | **required**: `shipped` · `next` · `horizon` · `plan` |
| `kind` | string | **required**: `video` · `article` · `feature` · `problems` · `interactive` · `community` · `event` · `product` (sets the card's icon and label) |
| `position` | int | ≥ 0, default 0. Order within the column. |
| `title.en`, `title.bn` | string | **both required**, ≤ 160 characters |
| `desc.en`, `desc.bn` | string | optional, ≤ 400 characters |
| `progress` | int \| null | 0–100. **Kept only when `stage` is `next`**; dropped for any other stage. |
| `link` | string \| null | A site path (`/learn/...`) or an `https://` URL, ≤ 300 characters. Shown as "দেখো →" on the card. |
| `shipped_at` | timestamp \| null | **Kept only when `stage` is `shipped`.** Leave it out and the server fills it in (see below). |
| `id`, `updated_at` | | set by the server |

**How stages work:** to move an item to another column, change only its `stage`.

- Moving to `shipped` stamps `shipped_at` with the current time. Send `shipped_at` yourself to backdate it.
- An item that is already shipped keeps its original `shipped_at` when you edit it again.
- Moving out of `shipped` clears `shipped_at`. Moving out of `next` clears `progress`.

### GET `/roadmap` (public)

Every item in page order. No auth needed.

```bash
curl http://localhost:8080/api/v1/roadmap
```

```json
{ "stages": ["shipped", "next", "horizon", "plan"], "items": [ { "…": "item" } ] }
```

Caching: `Cache-Control` lets browsers keep the response for 60 s and shared caches (CDN) for 300 s.
The home page also re-fetches at most once a minute, so an admin edit shows up within about a minute
locally, and within about 5 minutes behind a CDN.

### POST `/admin/roadmap` (admin)

Creates an item. Returns **201** with the item.

```bash
curl -X POST http://localhost:8080/api/v1/admin/roadmap \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "slug": "dsa-graphs",
    "stage": "next",
    "kind": "video",
    "position": 4,
    "title": { "en": "DSA: Graphs from zero", "bn": "DSA: শূন্য থেকে Graph" },
    "desc":  { "en": "BFS, DFS and shortest paths with animations.", "bn": "Animation সহ BFS, DFS আর shortest path।" },
    "progress": 10
  }'
```

Errors: `409 slug_taken`, and `422` with one of `invalid_slug`, `invalid_stage`, `invalid_kind`,
`invalid_position`, `title_required`, `title_too_long`, `desc_too_long`, `invalid_link`, `invalid_progress`.

### PUT `/admin/roadmap/{id}` (admin)

**Replaces** the whole item, so send every field you want to keep. Optional fields you leave out
(`desc`, `progress`, `link`) are cleared. Returns **200** with the item, or `404` for an unknown id.

Example: ship the item from above and link it.

```bash
curl -X PUT http://localhost:8080/api/v1/admin/roadmap/$ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "slug": "dsa-graphs",
    "stage": "shipped",
    "kind": "video",
    "position": 0,
    "title": { "en": "DSA: Graphs from zero", "bn": "DSA: শূন্য থেকে Graph" },
    "desc":  { "en": "BFS, DFS and shortest paths with animations.", "bn": "Animation সহ BFS, DFS আর shortest path।" },
    "link": "/learn/dsa/graphs"
  }'
```

### DELETE `/admin/roadmap/{id}` (admin)

Returns **204**, or `404` if the item doesn't exist (or was already deleted).

```bash
curl -X DELETE http://localhost:8080/api/v1/admin/roadmap/$ID -H "Authorization: Bearer $TOKEN"
```

### Starter data

`make seed-roadmap` loads the starter items (4 shipped, 4 next, 3 horizon, 3 plan). It is safe to run
again: an item whose `slug` already exists is left alone, so your edits survive.

To find an item's `id`, look it up by slug in the public list:

```bash
curl -s http://localhost:8080/api/v1/roadmap | jq -r '.items[] | select(.slug=="dsa-graphs") | .id'
```
