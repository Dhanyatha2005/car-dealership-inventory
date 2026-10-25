# AGENTS.md

Instructions for every AI coding agent (and human) working in this repository.
The sources of truth are, in order: `docs/requirements.md` (what to build),
`docs/plan.md` (how and in which order), then this file (how to work).

## 1. Guardrails (from the pre-development audit)

1. **Follow the agreed stack, schema, API contract and naming.** Stack: npm workspaces,
   Express 5 + TypeScript, PostgreSQL + Prisma 7, Zod contracts in `@kata/shared`,
   React 19 + Vite + Tailwind v4, Vitest, Supertest, Playwright. Do not switch frameworks.
2. **Do not add dependencies, change frameworks or alter the architecture** without
   explaining why and getting approval. Phase 0 froze the lockfile (see protocol rule 1).
3. **Every behaviour change comes with tests.** Never delete, skip or weaken a test to make
   CI green.
4. **Do not invent requirements.** If something is ambiguous, check `docs/requirements.md`.
   If it is not covered there, stop and ask, or record a clearly labelled assumption.
5. **Keep changes small, scoped and reviewable.** Do not refactor unrelated modules.
   Touch only the files your task owns (see `docs/plan.md` section 7).
6. **Never put real secrets or credentials** in prompts, code, logs, fixtures or commits.
   Only `.env.example` placeholders and the local-docker values in `apps/api/.env.test`
   are committed.
7. **Report exactly what you ran.** List the commands and their real outcomes. Never claim
   a check passed if you did not run it.
8. **Enforce authorization in the backend**, not just by hiding UI. Never return password
   hashes. Stock never goes negative; a purchase and its stock decrement succeed or fail
   together.

## 2. Architecture rules (enforced by ESLint `no-restricted-imports`)

- `routes → controller → service → ports`; infra adapters (Prisma, bcryptjs, jose)
  implement ports; `container.ts` is the only composition root.
- `apps/api/src/core/**` and `apps/api/src/modules/**/*.service.ts` must not import
  `express`, `@prisma/*`, `**/generated/**` or `**/infra/**`.
- A module imports another module only through its `*.repository`, `*.entity` or
  `*.ports` files, never its controller, routes, mapper or `prisma-*.repository` adapter.
- `packages/shared/src/**` (non-test) imports only `zod`.
- `apps/web/src/components/ui/**` must not import `@/features/*`, `@/lib/api/*` or
  `@tanstack/*`. Features import ui only through the `@/components/ui` barrel.
- Visual styling lives only in `styles/tokens.css`, `components/ui/**` and
  `components/layout/**` (the re-skin surface).

## 3. Parallel execution protocol (plan section 6)

1. **Lockfile freeze.** Phase 0 declared every dependency for every workspace and ran
   `npm install` once. Sub-agents must not add dependencies. If one is truly needed, stop
   and report; the orchestrator adds it on `main`.
2. **Git worktrees for parallel agents.** Each parallel task runs
   `git worktree add ../KATA-wt/<task> -b p<N>/<task>`, then `npm ci` there, and commits
   only inside its worktree. Never run parallel agents in the same working tree (they
   share the index). To integrate, the orchestrator runs `git rebase main` in the
   worktree, then `git merge --ff-only` on `main`.
3. **Seam files** are edited by more than one module: `apps/api/src/container.ts`,
   `apps/api/src/modules/index.ts`, `apps/web/src/app/router.tsx`, root `package.json`,
   `.github/workflows/ci.yml`. Add only your own lines at the marked insertion points.
4. **One database per parallel API agent.** `test/global-setup.ts` honours
   `TEST_DATABASE_URL` and creates the database if missing. Assignments: `kata_test_auth`,
   `kata_test_vehicles`, `kata_test_inventory`. `main` uses `kata_test`. E2E uses
   `kata_e2e`, never `kata_test`.
5. **Commit format.** Stage explicit paths only, never `git add -A`. Use:

   ```sh
   git commit -m "<type(scope)>: <subject>" \
     -m "<what was done, that Claude Code drafted it, and what was verified>" \
     -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
   ```

   Keep the trailer identical on every AI-assisted commit.

6. **Red/green integrity.**
   - A red commit must still lint and typecheck: add the interface plus a stub that throws
     `new Error('not implemented')`, so tests fail on an assertion, not a missing import.
   - Paste the failing (red) and passing (green) test output into your report.
   - If a test passes on its first run, do not fake a red commit; commit it as
     `test(...): add characterization test ...`.
   - Push only at a green phase boundary.
7. **Phase gate** (orchestrator, on `main`):
   `npm run lint && npm run typecheck && npm run test:unit && npm run test:integration && npm run build`.

The pre-commit hook runs **lint-staged only** (Prettier + ESLint on staged files). It
never runs tests, so red commits remain possible.

## 4. Commands

| Task                            | Command                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| Start Postgres (port 5433)      | `npm run db:up`                                             |
| Dev servers (API :4000, web)    | `npm run dev`                                               |
| Lint / format / types           | `npm run lint`, `npm run format:check`, `npm run typecheck` |
| Unit tests (shared + API unit)  | `npm run test:unit`                                         |
| API integration tests (real DB) | `npm run test:integration`                                  |
| Web tests                       | `npm run test:web`                                          |
| Default test run                | `npm test` (unit + web)                                     |
| E2E                             | `npm run test:e2e`                                          |
| Build                           | `npm run build`                                             |
| Migrations / seed               | `npm run db:migrate`, `npm run db:seed`                     |

## 5. Gotchas

- Pinned versions: Prisma **exactly 7.10.1** (npm `latest` is an 8.0 RC; never take it),
  TypeScript `~6.0.3` (typescript-eslint 8.72 needs < 6.1), zod **exactly 4.6.7** in every
  workspace (`npm ls zod` must show one copy).
- Prisma 7 does not load `.env`; scripts wrap the CLI with `dotenv -e <file> --`.
  `migrate dev` does not run `generate` or the seed. `postinstall` runs `prisma generate`.
- TypeScript 6 defaults `types` to `[]`; each workspace tsconfig lists its ambient types.
- Express 5: `req.query` is read-only (parse into a local), `req.body` is `undefined` when
  there is no body, and path syntax is `/*splat`.
- No `.js` extensions on relative imports (`moduleResolution: Bundler`).
