# Car Dealership Inventory System

A full-stack, test-driven car dealership inventory system: an Express 5 + PostgreSQL REST
API with JWT authentication and role-based access, and a React + Tailwind single-page app
to browse, search, purchase and manage vehicles.

> Status: scaffold (Phase 0). Sections marked _TBD_ are completed in later phases.

## Tech stack

- **API:** Node.js 24, Express 5, TypeScript, Prisma 7, PostgreSQL 17, Zod, jose (JWT), bcryptjs
- **Web:** React 19, Vite 8, Tailwind CSS 4, TanStack Query, React Router, React Hook Form
- **Shared:** `@kata/shared`, Zod contracts used by both apps
- **Testing:** Vitest, Supertest, Testing Library, MSW, Playwright

## Repository layout

```
apps/api         Express REST API (@kata/api)
apps/web         React SPA (@kata/web)
packages/shared  Zod contracts shared by API and web (@kata/shared)
e2e              Playwright end-to-end tests (@kata/e2e)
docs             requirements, plan, architecture, ADRs, test report
```

## Getting started

Prerequisites: Node.js 24 (`nvm use`), npm 11 and Docker.

```sh
npm ci                                   # installs all workspaces and generates the Prisma client
cp apps/api/.env.example apps/api/.env   # local development settings
npm run db:up                            # Postgres on localhost:5433 (kata_dev, kata_test, kata_e2e)
npm run db:migrate                       # TBD (Phase 1)
npm run db:seed                          # TBD (Phase 3)
npm run dev                              # API on :4000, web on :5173
```

## Scripts

| Command                    | What it does                                  |
| -------------------------- | --------------------------------------------- |
| `npm run dev`              | Runs the API and web dev servers concurrently |
| `npm run lint`             | ESLint, including architecture boundary rules |
| `npm run format:check`     | Prettier check                                |
| `npm run typecheck`        | `tsc --noEmit` in every workspace             |
| `npm test`                 | Unit tests (shared + API) and web tests       |
| `npm run test:integration` | API integration tests against Postgres        |
| `npm run test:e2e`         | Playwright end-to-end tests                   |
| `npm run test:coverage`    | Coverage for every workspace                  |
| `npm run build`            | Production builds of the API and web app      |

## API

_TBD:_ endpoint overview. The OpenAPI document will be served at `/api/openapi.json` and
Swagger UI at `/api/docs`.

## Screenshots

_TBD_

## Test Report

_TBD_

## My AI Usage

_TBD_

## Deployment

_TBD_
