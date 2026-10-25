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

**Tools used**

- **Claude Code (Claude Opus 5.5)** was the primary tool. It acted as an orchestrator that spawned sub-agents: a planner agent, then phase agents running in parallel in isolated git worktrees.
- **ChatGPT** produced a pre-development audit that I used as a second opinion on the stack and on gaps in the requirements.

**How I used them**

1. **Requirements and stack.** I gave Claude Code the kata document and asked it to choose a stack only after reading the full scope. It chose Express + TypeScript, PostgreSQL + Prisma, shared Zod contracts and React + Tailwind. I then compared that against the ChatGPT audit. The two agreed on the core. I kept one deliberate difference: Bearer JWT instead of an HTTP-only cookie, because it matches the spec's wording and works across origins.
2. **Planning.** A planner agent produced [`docs/plan.md`](docs/plan.md): the folder tree, ports and adapters interfaces, the Prisma schema, the API contract, and a red/green commit sequence. It also checked npm package versions against the registry, and caught that `prisma@latest` resolves to an 8.0 release candidate.
3. **Implementation.** Phase agents wrote the tests first and committed them failing (`test:` commits), then committed the implementation (`feat:` commits). Agents ran in parallel in separate git worktrees, each with its own Postgres test database. Claude Code merged the branches and ran the lint, typecheck and test gate after each merge.
4. **Design.** I designed the UI direction myself (light neumorphism, [`docs/design`](docs/design)). The agents implemented it as design tokens and primitives.
5. **Review.** The orchestrator reviewed every agent report. It found and fixed issues such as the money helpers not being exported. It also rewrote commit authorship so that commits link to my GitHub account.

**Reflection**

AI made the architecture and test scaffolding dramatically faster. Parallel agents with strict file ownership and red/green rules produced a clean, traceable history. Human decisions still mattered where the spec was ambiguous:

- purchase semantics: recorded purchases with a price snapshot
- the role matrix
- soft deletes
- fixed categories
- the design language

The biggest risk was speed against quality. Time-boxing the agents left some phases partial, and I've recorded that honestly in the commit history and in the status below. Every commit made with AI carries a `Co-Authored-By: Claude` trailer, and the raw session log is in [`PROMPTS.md`](PROMPTS.md).

## Deployment

_TBD_
