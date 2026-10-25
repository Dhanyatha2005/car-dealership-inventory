# Requirements

This document is the source of truth for **what** the system does. Part 1 restates the
kata specification ("TDD Kata: Car Dealership Inventory System", V2). Part 2 records the
assumptions and decisions that close the gaps the pre-development audit found (P0/P1).
The implementation plan is in [`plan.md`](./plan.md).

## Part 1: Specification

### Backend API (REST)

- Node.js/TypeScript with Express, backed by a real database (PostgreSQL). An in-memory
  database is not sufficient.
- Users can register and log in. Token-based authentication (JWT) protects endpoints.
- Endpoints:
  - Auth: `POST /api/auth/register`, `POST /api/auth/login`
  - Vehicles (protected): `POST /api/vehicles`, `GET /api/vehicles`,
    `GET /api/vehicles/search` (by make, model, category or price range),
    `PUT /api/vehicles/:id`, `DELETE /api/vehicles/:id` (admin only)
  - Inventory (protected): `POST /api/vehicles/:id/purchase` (decreases quantity),
    `POST /api/vehicles/:id/restock` (increases quantity, admin only)
- Each vehicle has a unique ID, make, model, category, price and quantity in stock.

### Frontend (SPA)

- HTML5, CSS3, Tailwind and React.
- Registration and login forms.
- A dashboard listing all available vehicles, with search and filtering.
- A "Purchase" button on each vehicle, disabled when quantity is zero.
- Admin forms/UI to add, update and delete vehicles.
- Visually appealing, responsive, good UX.

### Process

- Test-driven development with a visible Red-Green-Refactor history, especially for
  backend logic, and high, meaningful coverage.
- Clean code: SOLID, readable naming, meaningful comments.
- Frequent, descriptive commits. Every AI-assisted commit carries an AI co-author trailer.

### Deliverables

- Public Git repository.
- `README.md`: project explanation, local setup and run instructions (backend and
  frontend), screenshots, a "My AI Usage" section, and a test report.
- Root `PROMPTS.md` with raw, unedited AI chat logs or public chat links (no summaries).
- Optional: a deployed live application.

## Part 2: Assumptions and decisions

Each item is a documented assumption where the specification is silent.

### Domain (audit P0)

| #   | Topic               | Decision                                                                                                                                                       |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Vehicle identity    | A vehicle is a **listing with stock** (a make/model offer with a quantity), not an individual physical car. No VIN tracking.                                   |
| A2  | Meaning of purchase | A purchase **creates a purchase record** (buyer, vehicle, quantity, unit price snapshot, timestamp) and decrements stock in the same transaction. No payments. |
| A3  | Purchase quantity   | Body `{ quantity? }`, integer 1–10, default 1; an empty body buys one unit.                                                                                    |
| A4  | Inventory invariant | Stock never goes negative (enforced by a conditional update and a database CHECK). Concurrent purchases of the last unit cannot oversell.                      |
| A5  | Quantity changes    | `PUT /api/vehicles/:id` **cannot change quantity** (sending it is a 400). Stock changes only through purchase and restock. Restock quantity is 1–10,000.       |
| A6  | Deletion            | `DELETE` is a **soft delete** (archive). **Archived vehicles are hidden** from list, search and get, **and cannot be purchased** (404).                        |
| A7  | Money               | Prices are stored and transferred as **integer cents** (`priceCents`). The UI formats them; dollar input is converted by string parsing, never floats.         |
| A8  | Out of stock        | Out-of-stock vehicles are still listed (the UI disables Purchase). Purchasing more than is available returns 409 `INSUFFICIENT_STOCK`.                         |

### Roles and permissions (audit P0)

- Two roles: `USER` and `ADMIN`. Public registration always creates `USER`.
- The initial admin is created by the seed script from `SEED_ADMIN_*` environment variables.
- Read endpoints (`GET /api/vehicles`, `/search`, `/:id`) and purchase require any
  authenticated user.
- Create, update, delete and restock are **admin only**. (The spec reserves only delete and
  restock explicitly; we also restrict create and update to admins, because the frontend
  section scopes those forms to admins.)
- Authorization is enforced in the backend. The UI hides admin controls only as UX.

### API contract (audit P0)

- IDs are UUIDs. Malformed IDs return 400.
- **Validation errors return 400** (not 422).
- Error body is always `{ "error": { "code", "message", "details?" } }`. Status codes:
  401 unauthenticated, 403 forbidden, 404 not found, 409 conflict (`EMAIL_TAKEN`,
  `INSUFFICIENT_STOCK`), 413 payload too large, 429 rate limited, 500 internal.
- Lists return `{ items, page, pageSize, total }`; default page size 12, maximum 50;
  default sort `createdAt desc` with `id` as a stable tie-breaker.
- The OpenAPI document is served at `/api/openapi.json` with Swagger UI at `/api/docs`.

### Search (audit P1)

- Case-insensitive partial match on make and model (and a free-text `q`), exact category,
  inclusive `minPrice`/`maxPrice` in cents, exact year and fuel type.
- `minPrice > maxPrice` is a 400. A search with no filters returns all active vehicles.

### Security (audit P1)

- Passwords: bcrypt (bcryptjs), length 8–72 (bcrypt truncates beyond 72 bytes). Hashes
  are never returned.
- Auth: a stateless JWT bearer token (default lifetime 1 hour) sent in the `Authorization`
  header and stored by the SPA in `localStorage`. This deviates from the audit's
  HTTP-only cookie suggestion; bearer tokens avoid CSRF handling and cross-site cookie
  issues between the separately hosted frontend and API. ADR-0006 records the tradeoff.
  Logout is client-side (token discarded).
- Login and registration are rate limited. CORS is an explicit origin allowlist. JSON bodies
  are limited to 100 kB. Helmet sets security headers. Logs are structured and redact
  `Authorization` headers and passwords.
- Emails are trimmed and lowercased. Login failures use a uniform `INVALID_CREDENTIALS`.

### Definition of done (audit P1)

- Unit, integration (real Postgres) and end-to-end tests, including a concurrency test for
  the last unit, all green in CI.
- A fresh clone can install, start the database, migrate, seed and test with the commands
  in the README.
- Deployment is optional and happens only after the core acceptance tests pass.
