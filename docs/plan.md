# Car Dealership Inventory System: Implementation Plan

I read both source documents in full. I also checked the npm registry on 2026-10-25, and two package defaults would break this stack. The version pins in section 0 deal with them.

---

## 0. Version pins (decide once in Phase 0, then freeze)

| Package(s) | Pin | Reason |
|---|---|---|
| `prisma`, `@prisma/client`, `@prisma/adapter-pg` | **exactly `7.10.1`** | npm's `latest` tag for `prisma` points to `8.0.0-rc.27`. A plain `npm i prisma` installs a release candidate. |
| `typescript` | **`~6.0.3`** | TS 7.0.2 is `latest`, but `typescript-eslint@8.72` only accepts TypeScript below 6.1. |
| `zod` | `4.6.x` (one exact version across all workspaces) | `@asteasolutions/zod-to-openapi@9.1` needs zod ^4. A duplicate copy breaks `instanceof ZodError`. |
| `express` 5.3, `@types/express` 5 | | Express 5 sends rejected promises to the error handler, so no `asyncHandler` wrapper is needed. |
| `vitest` 5.0.5 + `@vitest/coverage-v8` 5.0.5, `supertest` 7.3 | | |
| `vite` 8.3, `@vitejs/plugin-react` 6, `tailwindcss` + `@tailwindcss/vite` 4.3 | | Tailwind 4 is configured in CSS with `@theme`; there is no `tailwind.config.js`. |
| `react` 19.3, `react-router` 8.5, `@tanstack/react-query` 5, `react-hook-form` 7.91, `@hookform/resolvers` 6, `msw` 3, `@testing-library/react`, `jsdom` | | |
| `jose` 6 (JWT), `bcryptjs` 3 (bcrypt algorithm, pure JS) | | ESM-native and no native build, so nothing can fail on Render. `bcryptjs` is the same bcrypt algorithm. |
| `helmet` 8, `cors`, `express-rate-limit` 8, `swagger-ui-express` 5, `@asteasolutions/zod-to-openapi` 9.1, `pino` + `pino-http` | | |
| `tsx` 4.23 (dev runtime), `tsup` 9 (API production bundle), `dotenv-cli` (Prisma CLI env files), `concurrently` | | |
| `eslint` 10, `typescript-eslint` 8.72, `prettier` 3, `husky` + `lint-staged`, `@playwright/test` 1.64 | | |

All workspaces use `"type": "module"`. Root `package.json` sets `"engines": {"node": ">=24"}` and `"packageManager": "npm@11.3.0"`, and `.nvmrc` contains `24`.

---

## 1. Folder tree

```
KATA/
├── .github/workflows/ci.yml          # quality → api tests (pg service) → web test+build → e2e
├── .husky/pre-commit                 # lint-staged only (prettier+eslint on staged files). NEVER runs tests: red commits must be possible
├── apps/
│   ├── api/                          # @kata/api: Express 5 REST API
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # data model (Prisma 7, prisma-client generator)
│   │   │   ├── migrations/           # generated SQL + hand-edited raw SQL (CHECKs, pg_trgm)
│   │   │   └── seed.ts               # idempotent: admin from SEED_ADMIN_* env + sample vehicles (incl. one qty 0)
│   │   ├── src/
│   │   │   ├── server.ts             # process entry: loadEnv → prisma → buildContainer → createApp → listen; graceful shutdown
│   │   │   ├── app.ts                # createApp(container): middleware pipeline + module mounting; no listen (testable)
│   │   │   ├── container.ts          # COMPOSITION ROOT: the only place that news up adapters/services (manual DI)
│   │   │   ├── config/env.ts         # Zod env schema; parseEnv(source) → typed Env; fails fast at startup
│   │   │   ├── core/                 # framework-free kernel (no express/prisma imports)
│   │   │   │   ├── errors.ts         # AppError + NotFound/Conflict/Unauthorized/Forbidden/Validation subclasses
│   │   │   │   ├── auth.ts           # Role, AuthPrincipal
│   │   │   │   └── pagination.ts     # Page<T>, toSkipTake(), toPage()
│   │   │   ├── http/                 # Express-specific glue shared by all modules
│   │   │   │   ├── api-module.ts     # ApiModule interface (router + openapi contribution)
│   │   │   │   ├── error-handler.ts  # AppError | ZodError | Prisma known errors | body-parser errors → {error:{...}}
│   │   │   │   ├── error-status.ts   # Record<ErrorCode, httpStatus>, the single mapping table
│   │   │   │   ├── not-found.ts      # ROUTE_NOT_FOUND
│   │   │   │   ├── security.ts       # helmet + cors(allowlist from env) + json limit
│   │   │   │   └── middleware/
│   │   │   │       ├── authenticate.ts   # createAuthenticate(tokenService)
│   │   │   │       ├── require-role.ts   # requireRole(...roles)
│   │   │   │       ├── rate-limit.ts     # createAuthRateLimiter(env)
│   │   │   │       └── request-logger.ts # pino-http, redacts Authorization
│   │   │   ├── infra/                # adapters implementing ports
│   │   │   │   ├── prisma.ts         # createPrismaClient(url) using @prisma/adapter-pg
│   │   │   │   ├── prisma-unit-of-work.ts
│   │   │   │   ├── bcrypt-password-hasher.ts
│   │   │   │   ├── jose-token-service.ts
│   │   │   │   └── logger.ts
│   │   │   ├── openapi/
│   │   │   │   ├── registry.ts       # creates OpenAPIRegistry; registers ErrorResponse + bearerAuth scheme
│   │   │   │   └── document.ts       # buildOpenApiDocument(modules) → OpenAPI 3.1 object
│   │   │   ├── modules/
│   │   │   │   ├── index.ts          # buildModules(container): ApiModule[]; add or remove a feature with ONE line
│   │   │   │   ├── health/health.module.ts          # GET /api/health
│   │   │   │   ├── users/                           # data-only module (no routes)
│   │   │   │   │   ├── user.entity.ts
│   │   │   │   │   ├── user.repository.ts           # port
│   │   │   │   │   └── prisma-user.repository.ts    # adapter
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.ports.ts                # PasswordHasher, TokenService
│   │   │   │   │   ├── auth.service.ts (+ .test.ts)
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.openapi.ts
│   │   │   │   │   ├── user.mapper.ts               # User → PublicUser (never leaks passwordHash)
│   │   │   │   │   └── auth.module.ts               # createAuthModule(deps): ApiModule
│   │   │   │   ├── vehicles/
│   │   │   │   │   ├── vehicle.entity.ts
│   │   │   │   │   ├── vehicle.repository.ts        # port
│   │   │   │   │   ├── prisma-vehicle.repository.ts
│   │   │   │   │   ├── vehicle.service.ts (+ .test.ts)
│   │   │   │   │   ├── vehicle.controller.ts
│   │   │   │   │   ├── vehicle.routes.ts
│   │   │   │   │   ├── vehicle.mapper.ts            # entity → VehicleDto
│   │   │   │   │   ├── vehicle.openapi.ts
│   │   │   │   │   └── vehicle.module.ts
│   │   │   │   └── inventory/
│   │   │   │       ├── purchase.entity.ts
│   │   │   │       ├── purchase.repository.ts       # port
│   │   │   │       ├── unit-of-work.ts              # port
│   │   │   │       ├── prisma-purchase.repository.ts
│   │   │   │       ├── inventory.service.ts (+ .test.ts)
│   │   │   │       ├── inventory.controller.ts
│   │   │   │       ├── inventory.routes.ts          # /vehicles/:id/purchase, /vehicles/:id/restock, /purchases/me
│   │   │   │       ├── inventory.openapi.ts
│   │   │   │       └── inventory.module.ts
│   │   │   ├── types/express.d.ts    # declare global Express.Request { auth?: AuthPrincipal }
│   │   │   └── generated/prisma/     # Prisma client output (gitignored, produced by `prisma generate`)
│   │   ├── test/
│   │   │   ├── global-setup.ts       # create test DB if missing + `prisma migrate deploy`
│   │   │   ├── integration-setup.ts  # beforeEach: resetDatabase(); afterAll: $disconnect
│   │   │   ├── support/
│   │   │   │   ├── fakes/            # InMemoryUser/Vehicle/PurchaseRepository, InMemoryUnitOfWork, FakePasswordHasher, FakeTokenService
│   │   │   │   ├── contracts/        # vehicleRepositoryContract(makeRepo), purchaseRepositoryContract(makeRepo)
│   │   │   │   ├── factories.ts      # buildVehicleInput(overrides), buildRegisterInput()
│   │   │   │   ├── db.ts             # testPrisma, resetDatabase() (TRUNCATE ... CASCADE)
│   │   │   │   ├── test-app.ts       # buildTestApp(envOverrides?) → real container + app
│   │   │   │   └── auth-helpers.ts   # createUserWithToken(role)
│   │   │   └── integration/          # *.int.test.ts: auth, vehicles, inventory, concurrency, db-constraints, seed, openapi
│   │   ├── prisma.config.ts          # Prisma 7 config: schema path, migrations path, seed cmd, datasource url (DIRECT_DATABASE_URL ?? DATABASE_URL)
│   │   ├── tsup.config.ts            # bundles src/server.ts → dist/, noExternal: [/^@kata\//]
│   │   ├── vitest.config.ts          # projects: "unit" (src/**/*.test.ts, parallel), "integration" (test/integration/**, serial)
│   │   ├── .env.example              # dev template (committed)
│   │   ├── .env.test                 # committed; local docker creds + throwaway JWT secret only
│   │   └── package.json
│   └── web/                          # @kata/web: Vite + React SPA
│       ├── src/
│       │   ├── main.tsx
│       │   ├── app/
│       │   │   ├── App.tsx
│       │   │   ├── providers.tsx     # QueryClientProvider, AuthProvider, RouterProvider
│       │   │   ├── router.tsx        # route table
│       │   │   └── guards.tsx        # RequireAuth, RequireAdmin (UX only; backend enforces)
│       │   ├── lib/                  # framework-agnostic data layer
│       │   │   ├── api/
│       │   │   │   ├── http-client.ts    # fetch wrapper: base URL, Bearer header, ApiError parsing, 401 → logout event
│       │   │   │   ├── api-error.ts
│       │   │   │   ├── auth.api.ts
│       │   │   │   ├── vehicles.api.ts
│       │   │   │   └── inventory.api.ts  # typed endpoint functions; parse responses with shared schemas
│       │   │   ├── auth/token-storage.ts # the ONLY place touching localStorage
│       │   │   ├── query-client.ts
│       │   │   └── query-keys.ts
│       │   ├── features/             # data + behavior; uses ui primitives, never styles visually
│       │   │   ├── auth/{hooks,components,pages}/        # useLogin/useRegister/useMe, AuthProvider, LoginForm, RegisterForm
│       │   │   ├── vehicles/{hooks,components,pages}/    # useVehicles/useVehicleSearch/useVehicleMutations, VehicleCard(actions slot), VehicleGrid, VehicleFilters, VehicleForm, DashboardPage, AdminVehiclesPage, VehicleEditorPage
│       │   │   └── inventory/{hooks,components,pages}/   # usePurchase/useRestock/useMyPurchases, PurchaseButton, RestockDialog, PurchaseHistoryTable, MyPurchasesPage
│       │   ├── components/
│       │   │   ├── ui/               # RE-SKIN SURFACE: Button, Input, Select, Card, Badge, Dialog, Spinner, EmptyState, ErrorState, Pagination, FormField, Toast, index.ts barrel
│       │   │   └── layout/           # RE-SKIN SURFACE: AppShell, Navbar, PageHeader
│       │   ├── styles/
│       │   │   ├── tokens.css        # RE-SKIN SURFACE: CSS variables (colors, radii, shadows raised/inset, blur, spacing)
│       │   │   └── index.css         # @import "tailwindcss"; @theme inline { map tokens → utilities }
│       │   └── test/
│       │       ├── setup.ts          # jest-dom, MSW server lifecycle
│       │       ├── msw/{handlers.ts,server.ts}
│       │       ├── factories.ts      # vehicleDto(), userDto()
│       │       └── render.tsx        # renderWithProviders(ui, {route, user})
│       ├── public/
│       ├── index.html
│       ├── vite.config.ts            # react + tailwind plugins, @ alias, dev proxy /api → :4000, vitest config
│       ├── vercel.json               # SPA rewrite
│       ├── .env.example              # VITE_API_URL
│       └── package.json
├── packages/
│   └── shared/                       # @kata/shared: contract package (zod only)
│       ├── src/
│       │   ├── enums.ts              # ROLES, VEHICLE_CATEGORIES, FUEL_TYPES, TRANSMISSIONS (as const + z.enum)
│       │   ├── errors.ts             # ErrorCode enum + ErrorResponseSchema
│       │   ├── money.ts              # formatCents, dollarsToCents (string-based, no float drift)
│       │   ├── schemas/{common,auth,vehicle,inventory}.ts
│       │   └── index.ts              # barrel
│       ├── src/**/*.test.ts
│       └── package.json              # "exports": {".": "./src/index.ts"}
├── e2e/                              # @kata/e2e: Playwright workspace
│   ├── playwright.config.ts          # webServer: api (kata_e2e DB) + web; chromium only
│   ├── global-setup.ts               # migrate reset + seed kata_e2e
│   ├── fixtures.ts                   # loginAs(role), unique emails
│   └── tests/{auth,shopping,admin}.spec.ts
├── docker/postgres/init/01-create-databases.sql   # creates kata_test, kata_e2e
├── docker-compose.yml                # postgres:17-alpine on host port 5433, healthcheck, named volume
├── scripts/generate-test-report.mjs  # vitest JSON + coverage-summary → docs/test-report.md
├── docs/
│   ├── requirements.md               # spec + documented assumptions (resolves the audit's P0/P1 gaps)
│   ├── architecture.md               # layers, dependency rules, request lifecycle, purchase sequence diagram
│   ├── deployment.md
│   ├── test-report.md                # committed, generated
│   ├── screenshots/
│   └── adr/0001…0010-*.md
├── eslint.config.js                  # flat config + boundary rules (no-restricted-imports)
├── tsconfig.base.json                # strict, noUncheckedIndexedAccess, module ESNext, moduleResolution Bundler
├── .prettierrc  .prettierignore  .editorconfig  .gitignore  .nvmrc
├── render.yaml                       # Render blueprint (deploy phase)
├── AGENTS.md  PROMPTS.md  README.md
├── package.json                      # workspaces: ["apps/*","packages/*","e2e"]; orchestration scripts
└── package-lock.json
```

**Test placement:**
- Unit tests sit next to the code they cover (`*.test.ts`).
- Integration tests live in `apps/api/test/integration` (`*.int.test.ts`).
- Fakes and contract suites live in `test/support`. They are never bundled, because tsup's only entry point is `server.ts`.

---

## 2. Architecture

### 2.1 Dependency direction (enforced by ESLint `no-restricted-imports`)

```
routes → controller → service → ports (repository/UoW/hasher/token interfaces)
                                   ↑
                         infra adapters (Prisma, bcryptjs, jose) implement ports
container.ts wires adapters into services; app.ts mounts modules.
core/ and @kata/shared are leaves (import nothing internal).
```

ESLint override rules:
- `apps/api/src/core/**` and `apps/api/src/modules/**/*.service.ts` may not import `express`, `@prisma/*`, `**/generated/**` or `**/infra/**`.
- A module may import another module only through its port or entity files. For example, `inventory` imports `vehicles/vehicle.repository.ts` and `vehicle.entity.ts`, never its controller or Prisma adapter.
- `packages/shared/**` may import only `zod`.
- `apps/web/src/components/ui/**` may not import `@/features/*`, `@/lib/api/*` or `@tanstack/*`.
- `apps/web/src/features/**` may import ui only through the `@/components/ui` barrel.

### 2.2 Module contract and composition root

```ts
// http/api-module.ts
export interface ApiModule {
  name: string;
  router: Router;                                  // mounted at /api
  registerOpenApi(registry: OpenAPIRegistry): void;
}

// container.ts
export interface Container {
  env: Env;
  prisma: PrismaClient;
  logger: Logger;
  tokenService: TokenService;
  authenticate: RequestHandler;
  services: { auth: AuthService; vehicles: VehicleService; inventory: InventoryService };
  healthCheck: () => Promise<boolean>;
}
export function buildContainer(env: Env, prisma: PrismaClient, overrides?: Partial<Container>): Container;

// modules/index.ts
export const buildModules = (c: Container): ApiModule[] => [
  createHealthModule(c), createAuthModule(c), createVehiclesModule(c), createInventoryModule(c),
];

// app.ts
export function createApp(c: Container): Express;
// Pipeline: trust proxy (env) → request logger → helmet → cors → express.json({limit:'100kb'})
//           → modules → /api/openapi.json + /api/docs → notFound → errorHandler
```

Integration tests call `buildTestApp()`, which uses the real container against the test database. Unit tests construct services directly with fakes. Tests that need a different rate limit pass env overrides into the container.

### 2.3 Error model

- `@kata/shared/errors.ts` defines the `ErrorCode` union so the web app can switch on codes: `VALIDATION_ERROR | INVALID_JSON | UNAUTHENTICATED | INVALID_CREDENTIALS | FORBIDDEN | ROUTE_NOT_FOUND | VEHICLE_NOT_FOUND | USER_NOT_FOUND | EMAIL_TAKEN | INSUFFICIENT_STOCK | PAYLOAD_TOO_LARGE | RATE_LIMITED | INTERNAL_ERROR`.
- `core/errors.ts` has no HTTP knowledge:
  ```ts
  export class AppError extends Error {
    constructor(readonly code: ErrorCode, message: string, readonly details?: unknown) { super(message); }
  }
  export class NotFoundError extends AppError {}   // codes: VEHICLE_NOT_FOUND, USER_NOT_FOUND
  export class ConflictError extends AppError {}   // EMAIL_TAKEN, INSUFFICIENT_STOCK
  export class UnauthorizedError extends AppError {} // UNAUTHENTICATED, INVALID_CREDENTIALS
  export class ForbiddenError extends AppError {}
  ```
- `http/error-status.ts` holds `ERROR_STATUS: Record<ErrorCode, number>`. Because the type is exhaustive, adding a code without a status fails compilation.
- `error-handler.ts` maps errors as follows. The response shape is always `{ error: { code, message, details? } }`.

  | Error | Code | Status |
  |---|---|---|
  | `AppError` | its own code | from `ERROR_STATUS` |
  | `ZodError` | `VALIDATION_ERROR` | 400, with `details = issues[{path, message}]` |
  | body-parser `entity.parse.failed` | `INVALID_JSON` | 400 |
  | `entity.too.large` | `PAYLOAD_TOO_LARGE` | 413 |
  | Prisma `P2002` | `EMAIL_TAKEN` | 409 (safety net; the repository already translates it) |
  | anything else | `INTERNAL_ERROR` | 500, logged with no stack in the response |

- Controllers validate with the shared schemas, e.g. `CreateVehicleSchema.parse(req.body)`. A thrown `ZodError` reaches the handler through Express 5's async error propagation. There is no separate validation middleware, which keeps the types simple.

### 2.4 Auth middleware

```ts
export function createAuthenticate(tokens: TokenService): RequestHandler;
// Reads "Authorization: Bearer <jwt>". Missing or malformed header → UnauthorizedError('UNAUTHENTICATED').
// Calls tokens.verify(), which throws UnauthorizedError on a bad signature or expiry.
// Sets req.auth = { userId: claims.sub, role: claims.role }. Stateless: no DB hit.

export function requireRole(...roles: Role[]): RequestHandler;
// No req.auth → 401 (guards against mis-ordered middleware). Role not allowed → ForbiddenError('FORBIDDEN').
```

Usage: `router.post('/vehicles', authenticate, requireRole('ADMIN'), ctrl.create)`.

`/api/auth/me` hits the database and returns 401 `UNAUTHENTICATED` if the user no longer exists. Roles live in the JWT, so a role change takes effect at the next login. ADR-0006 records this tradeoff.

### 2.5 Ports, repositories and services (signatures)

```ts
// core/auth.ts
export type Role = 'USER' | 'ADMIN';
export interface AuthPrincipal { userId: string; role: Role }

// auth/auth.ports.ts
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}
export interface TokenClaims { sub: string; role: Role }
export interface TokenService {
  sign(claims: TokenClaims): Promise<string>;
  verify(token: string): Promise<TokenClaims>;        // throws UnauthorizedError
}

// users/user.entity.ts + user.repository.ts
export interface User { id: string; email: string; name: string; passwordHash: string; role: Role; createdAt: Date; updatedAt: Date }
export type NewUser = Pick<User, 'email' | 'name' | 'passwordHash' | 'role'>;
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(normalizedEmail: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;               // throws ConflictError('EMAIL_TAKEN') on unique violation
  upsertAdmin(data: Omit<NewUser, 'role'>): Promise<User>; // seed only
}

// auth/auth.service.ts
export interface AuthResult { token: string; user: PublicUser }  // PublicUser from @kata/shared
export interface AuthService {
  register(input: RegisterInput): Promise<AuthResult>; // role always USER
  login(input: LoginInput): Promise<AuthResult>;       // unknown email and wrong password → same INVALID_CREDENTIALS
  getProfile(userId: string): Promise<PublicUser>;
}

// vehicles/vehicle.entity.ts + vehicle.repository.ts
export interface Vehicle {
  id: string; make: string; model: string; category: VehicleCategory; priceCents: number; quantity: number; year: number;
  color: string | null; fuelType: FuelType | null; transmission: Transmission | null;
  imageUrl: string | null; description: string | null;
  isActive: boolean; archivedAt: Date | null; createdAt: Date; updatedAt: Date;
}
export type NewVehicle = Omit<Vehicle, 'id' | 'isActive' | 'archivedAt' | 'createdAt' | 'updatedAt'>;
export type VehiclePatch = Partial<Omit<NewVehicle, 'quantity'>>;   // stock changes only via purchase/restock
export type VehicleSortField = 'createdAt' | 'priceCents' | 'year' | 'make';
export interface VehicleCriteria {
  q?: string; make?: string; model?: string; category?: VehicleCategory;
  minPriceCents?: number; maxPriceCents?: number; year?: number; fuelType?: FuelType;
  sortBy: VehicleSortField; sortOrder: 'asc' | 'desc'; skip: number; take: number;
}
export interface VehicleRepository {
  create(data: NewVehicle): Promise<Vehicle>;
  findActiveById(id: string): Promise<Vehicle | null>;
  search(c: VehicleCriteria): Promise<{ items: Vehicle[]; total: number }>; // active only; ORDER BY sortBy, id ASC
  update(id: string, patch: VehiclePatch): Promise<Vehicle | null>;          // null if missing/archived
  archive(id: string, at: Date): Promise<boolean>;                           // false if missing/already archived
  decrementStockIfAvailable(id: string, qty: number): Promise<Vehicle | null>; // atomic conditional; null = not active or insufficient
  incrementStock(id: string, qty: number): Promise<Vehicle | null>;          // active only
}

// vehicles/vehicle.service.ts
export interface VehicleService {
  create(input: CreateVehicleInput): Promise<Vehicle>;
  getById(id: string): Promise<Vehicle>;                         // NotFoundError('VEHICLE_NOT_FOUND')
  list(query: VehicleListQuery): Promise<Page<Vehicle>>;
  search(query: VehicleSearchQuery): Promise<Page<Vehicle>>;
  update(id: string, input: UpdateVehicleInput): Promise<Vehicle>;
  archive(id: string): Promise<void>;
}

// inventory/purchase.entity.ts + purchase.repository.ts + unit-of-work.ts
export interface Purchase { id: string; userId: string; vehicleId: string; quantity: number; unitPriceCents: number; createdAt: Date }
export interface PurchaseWithVehicle extends Purchase { vehicle: Pick<Vehicle, 'id' | 'make' | 'model' | 'year' | 'category'> }
export interface PurchaseRepository {
  create(data: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase>;
  listByUser(userId: string, skip: number, take: number): Promise<{ items: PurchaseWithVehicle[]; total: number }>;
}
export interface TransactionalRepositories { vehicles: VehicleRepository; purchases: PurchaseRepository }
export interface UnitOfWork {
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;  // all-or-nothing
}

// inventory/inventory.service.ts
export interface PurchaseResult { purchase: Purchase; vehicle: Vehicle }
export interface InventoryService {
  purchase(userId: string, vehicleId: string, input: PurchaseInput): Promise<PurchaseResult>;
  restock(vehicleId: string, input: RestockInput): Promise<Vehicle>;
  listMyPurchases(userId: string, q: PaginationQuery): Promise<Page<PurchaseWithVehicle>>;
}
```

**Purchase algorithm.** The service is framework-free.

```ts
uow.run(async ({ vehicles, purchases }) => {
  const updated = await vehicles.decrementStockIfAvailable(vehicleId, qty);
  if (!updated) {
    const v = await vehicles.findActiveById(vehicleId);
    if (!v) throw new NotFoundError('VEHICLE_NOT_FOUND', 'Vehicle not found');
    throw new ConflictError('INSUFFICIENT_STOCK', 'Not enough stock', { available: v.quantity, requested: qty });
  }
  const purchase = await purchases.create({ userId, vehicleId, quantity: qty, unitPriceCents: updated.priceCents });
  return { purchase, vehicle: updated };
});
```

**Prisma adapters:**
- `PrismaUnitOfWork.run` calls `prisma.$transaction(tx => work({ vehicles: new PrismaVehicleRepository(tx), purchases: new PrismaPurchaseRepository(tx) }))`. The repositories take `PrismaClient | Prisma.TransactionClient`.
- `decrementStockIfAvailable` runs `tx.vehicle.updateMany({ where: { id, isActive: true, quantity: { gte: qty } }, data: { quantity: { decrement: qty } } })`. If `count === 0` it returns null. Otherwise it re-reads the row inside the same transaction, where the row lock is still held, so the price snapshot is consistent.
- Under Postgres READ COMMITTED, a competing UPDATE blocks on the row lock and then re-checks `quantity >= qty`. That is what prevents overselling.

**`InMemoryUnitOfWork`** snapshots the fake repositories' maps before running the work and restores them if it throws. This makes unit tests able to assert rollback.

**Repository contract tests.** `test/support/contracts/vehicleRepositoryContract(makeRepo)` and `purchaseRepositoryContract` are run against both the in-memory fakes (unit project) and the Prisma adapters (integration project). This proves the fakes behave like Postgres for search semantics, pagination, sorting and conditional decrement. Unit tests on the fakes can then be trusted.

---

## 3. Prisma schema draft (`apps/api/prisma/schema.prisma`)

```prisma
generator client {
  provider     = "prisma-client"            // Prisma 7 generator
  output       = "../src/generated/prisma"
  moduleFormat = "esm"
}

datasource db {
  provider = "postgresql"                   // URL lives in prisma.config.ts (Prisma 7)
}

enum Role            { USER ADMIN }
enum VehicleCategory { SEDAN SUV TRUCK COUPE HATCHBACK CONVERTIBLE VAN WAGON }
enum FuelType        { PETROL DIESEL HYBRID ELECTRIC }
enum Transmission    { MANUAL AUTOMATIC }

model User {
  id           String     @id @default(uuid()) @db.Uuid
  email        String     @unique @db.VarChar(254)       // stored lowercase (normalized by Zod)
  name         String     @db.VarChar(80)
  passwordHash String     @map("password_hash")
  role         Role       @default(USER)
  purchases    Purchase[]
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt    DateTime   @updatedAt      @map("updated_at") @db.Timestamptz(3)
  @@map("users")
}

model Vehicle {
  id           String          @id @default(uuid()) @db.Uuid
  make         String          @db.VarChar(80)
  model        String          @db.VarChar(80)
  category     VehicleCategory
  priceCents   Int             @map("price_cents")
  quantity     Int             @default(0)
  year         Int
  color        String?         @db.VarChar(40)
  fuelType     FuelType?       @map("fuel_type")
  transmission Transmission?
  imageUrl     String?         @map("image_url") @db.VarChar(2048)
  description  String?         @db.VarChar(2000)
  isActive     Boolean         @default(true) @map("is_active")
  archivedAt   DateTime?       @map("archived_at") @db.Timestamptz(3)
  purchases    Purchase[]
  createdAt    DateTime        @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt    DateTime        @updatedAt      @map("updated_at") @db.Timestamptz(3)

  @@index([isActive, createdAt(sort: Desc), id])       // default list ordering
  @@index([isActive, category])
  @@index([isActive, priceCents])
  @@index([isActive, year])
  @@index([make(ops: raw("gin_trgm_ops"))],  type: Gin, map: "vehicles_make_trgm_idx")   // ILIKE '%x%'
  @@index([model(ops: raw("gin_trgm_ops"))], type: Gin, map: "vehicles_model_trgm_idx")
  @@map("vehicles")
}

model Purchase {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id")    @db.Uuid
  vehicleId      String   @map("vehicle_id") @db.Uuid
  quantity       Int
  unitPriceCents Int      @map("unit_price_cents")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  user           User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  vehicle        Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Restrict)
  @@index([userId, createdAt(sort: Desc)])
  @@index([vehicleId])
  @@map("purchases")
}
```

**Raw SQL.** Generate the first migration with `prisma migrate dev --create-only --name init`, then hand-edit `migration.sql`. Prepend this before any `CREATE INDEX`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Then make the CHECK constraints a separate red-to-green step with `prisma migrate dev --create-only --name vehicle_check_constraints`:

```sql
ALTER TABLE "vehicles"  ADD CONSTRAINT "vehicles_quantity_nonnegative" CHECK ("quantity" >= 0);
ALTER TABLE "vehicles"  ADD CONSTRAINT "vehicles_price_nonnegative"    CHECK ("price_cents" >= 0);
ALTER TABLE "vehicles"  ADD CONSTRAINT "vehicles_year_range"           CHECK ("year" BETWEEN 1886 AND 2100);
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_quantity_positive"   CHECK ("quantity" > 0);
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_unit_price_nonneg"   CHECK ("unit_price_cents" >= 0);
```

Prisma ignores CHECK constraints during drift detection, so later `migrate dev` runs will not drop them. Neon supports `pg_trgm`.

**`prisma.config.ts`:**
- `schema: 'prisma/schema.prisma'`
- `migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' }`
- `datasource: { url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL }`

The runtime client uses `new PrismaPg({ connectionString: env.DATABASE_URL })`.

**API scripts** (`dotenv-cli` loads the env files for the Prisma CLI):
- `db:generate`: `prisma generate`
- `postinstall`: `prisma generate`
- `db:migrate`: `dotenv -e .env -- prisma migrate dev`
- `db:migrate:deploy`: `prisma migrate deploy`
- `db:seed`: `dotenv -e .env -- prisma db seed`
- `db:test:reset`: `dotenv -e .env.test -- prisma migrate reset --force`

---

## 4. API contract

All bodies and responses are JSON. Lists return `{ items, page, pageSize, total }`. Errors return `{ error: { code, message, details? } }`. The rate limiter returns 429 `RATE_LIMITED`. Any unhandled failure returns 500 `INTERNAL_ERROR`.

| Method | Path | Auth | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/health` | public | none | 200 `{status:'ok', db:'up'}` | 503 if DB down |
| GET | `/api/openapi.json`, `/api/docs` | public | none | 200 | |
| POST | `/api/auth/register` | public, rate-limited | `RegisterInput {name 1–80, email (trim+lowercase), password 8–72}` | 201 `AuthResponse {token, user: PublicUser}` | 400, 409 `EMAIL_TAKEN`, 429 |
| POST | `/api/auth/login` | public, rate-limited | `LoginInput {email, password}` | 200 `AuthResponse` | 400, 401 `INVALID_CREDENTIALS`, 429 |
| GET | `/api/auth/me` | USER/ADMIN | none | 200 `{user: PublicUser}` | 401 |
| GET | `/api/vehicles` | USER/ADMIN | query `VehicleListQuery {page=1, pageSize=12 (max 50), sortBy=createdAt, sortOrder=desc}` | 200 `Paginated<Vehicle>` (active vehicles, out-of-stock included) | 400, 401 |
| GET | `/api/vehicles/search` | USER/ADMIN | query `VehicleSearchQuery = VehicleListQuery + {q?, make?, model?, category?, minPrice?, maxPrice? (integer cents, inclusive), year?, fuelType?}`; refine min ≤ max; no filters returns all | 200 `Paginated<Vehicle>` | 400, 401 |
| GET | `/api/vehicles/:id` | USER/ADMIN | `IdParam {id: uuid}` | 200 `Vehicle` | 400, 401, 404 `VEHICLE_NOT_FOUND` |
| POST | `/api/vehicles` | ADMIN | `CreateVehicleInput {make, model, category, priceCents int 1..1_000_000_000, quantity int 0..10_000, year int 1886..currentYear+1, color?, fuelType?, transmission?, imageUrl? (http/https url), description? ≤2000}` (strict) | 201 `Vehicle` + `Location` | 400, 401, 403 |
| PUT | `/api/vehicles/:id` | ADMIN | `UpdateVehicleInput` = Create without quantity, `.partial().strict()`, at least 1 field; `quantity` gives 400 | 200 `Vehicle` | 400, 401, 403, 404 |
| DELETE | `/api/vehicles/:id` | ADMIN | none | 204 (soft-delete: isActive=false, archivedAt=now) | 400, 401, 403, 404 (incl. already archived) |
| POST | `/api/vehicles/:id/purchase` | USER/ADMIN | `PurchaseInput {quantity? int 1..10, default 1}`; empty body allowed | 201 `PurchaseResult {purchase: PurchaseDto (+totalCents), vehicle: Vehicle}` | 400, 401, 404, 409 `INSUFFICIENT_STOCK {available, requested}` |
| POST | `/api/vehicles/:id/restock` | ADMIN | `RestockInput {quantity int 1..10_000}` | 200 `Vehicle` | 400, 401, 403, 404 |
| GET | `/api/purchases/me` | USER/ADMIN | query `PaginationQuery` | 200 `Paginated<PurchaseWithVehicleDto>` (newest first, id tiebreaker) | 400, 401 |

**`VehicleDto`:** `{id, make, model, category, priceCents, quantity, year, color, fuelType, transmission, imageUrl, description, createdAt, updatedAt}`. Nullable fields are `null`, dates are ISO strings, and `isActive` is never exposed.

**Ordering.** Register `/vehicles/search` before `/vehicles/:id`. The uuid validation on `:id` also turns `search` into a 400, which acts as a safety net.

**Purchase body.** Parse it as `PurchaseInputSchema.parse(req.body ?? {})`, because Express 5 leaves `req.body` undefined when there is no body.

---

## 5. Shared package (`@kata/shared`)

**Contents:**
- `enums.ts`: `ROLES`, `VEHICLE_CATEGORIES`, `FUEL_TYPES`, `TRANSMISSIONS`, `SORT_FIELDS` as `as const` tuples, plus their `z.enum` schemas and types.
- `errors.ts`: `ERROR_CODES`, `ErrorCode`, `ErrorResponseSchema`.
- `money.ts`: `formatCents(cents, locale='en-US', currency='USD')` and `dollarsToCents("12,499.99") → 1249999`. It parses strings, never floats.
- `schemas/common.ts`: `IdParamSchema`, `PaginationQuerySchema` (coerced ints), `paginated(itemSchema)` factory, `IsoDateString`.
- `schemas/auth.ts`: `RegisterInputSchema`, `LoginInputSchema`, `PublicUserSchema`, `AuthResponseSchema`, `MeResponseSchema`.
- `schemas/vehicle.ts`: `VehicleSchema` (DTO), `CreateVehicleInputSchema`, `UpdateVehicleInputSchema`, `VehicleListQuerySchema`, `VehicleSearchQuerySchema`, `PaginatedVehiclesSchema`.
- `schemas/inventory.ts`: `PurchaseInputSchema`, `RestockInputSchema`, `PurchaseSchema`, `PurchaseResultSchema`, `PurchaseWithVehicleSchema`, `PaginatedPurchasesSchema`.
- Every type is exported as `z.infer` (`z.input` for form values where defaults apply).
- The package has no OpenAPI dependency. The API registers the schemas with `registry.register('Vehicle', VehicleSchema)` and `registry.registerPath(...)`, so the web bundle stays lean.

**How the apps consume it: source exports, with no build step.**
- `packages/shared/package.json`: `"type":"module"`, `"exports": { ".": "./src/index.ts" }`, `"dependencies": {"zod": "<exact pin>"}`. The apps pin the same zod version, so npm hoists a single copy.
- **Vite and Vitest (web):** workspace symlinks resolve to real paths outside `node_modules`, so Vite treats them as source. It transpiles them, supports HMR, and does no pre-bundling.
- **Vitest (api):** same resolution.
- **tsx (api dev):** tsx transpiles any `.ts` file it loads.
- **tsc typecheck:** `moduleResolution: "Bundler"` follows `exports` to `.ts`. Each workspace runs `tsc --noEmit`.
- **Production API:** tsup bundles `src/server.ts` with `noExternal: [/^@kata\//]`, so `dist/server.js` contains shared plus the generated Prisma client and runs on plain `node`.
- **Production web:** Vite bundles everything.

Why: one mode works for every tool. There is no stale `dist` and no watch-build ordering. TS project references would add build ordering and `composite` and declaration overhead for no gain. Path aliases would fail at Node runtime.

---

## 6. Parallel execution protocol (applies to every phase)

1. **Lockfile freeze.** Phase 0 declares every dependency for every workspace and runs `npm install` once. Sub-agents must not add dependencies. If one is truly needed, the agent stops and reports, and the orchestrator adds it on `main`.
2. **Git worktrees for parallel agents.** Each parallel task gets `git worktree add ../KATA-wt/<task> -b p<N>/<task>`, runs `npm ci` there, and commits only inside its worktree. Never run parallel agents in the same working tree: they share the index, so one agent's commit can capture another agent's staged files. To integrate, the orchestrator runs `git rebase main` in the worktree and then `git merge --ff-only` on main. History stays linear and the red/green order is preserved.
3. **Seam files.** These are edited by more than one module: `apps/api/src/container.ts`, `apps/api/src/modules/index.ts`, `apps/web/src/app/router.tsx`, root `package.json`, `.github/workflows/ci.yml`. Phase 1 creates them with clear insertion points. Sub-agents may add only their own lines. The orchestrator resolves any rebase conflict, which will be trivial one-line additions.
4. **One database per parallel API agent.** `test/global-setup.ts` honours `TEST_DATABASE_URL` and creates the database if missing (`CREATE DATABASE` through the `postgres` maintenance DB) before `migrate deploy`. Assignments: `kata_test_auth`, `kata_test_vehicles`, `kata_test_inventory`. Main uses `kata_test`.
5. **Commit format.** Use `git commit -m "<type(scope)>: <subject>" -m "<what was done, and that Claude Code drafted it and what was verified>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`. Never `git add -A`. Stage explicit paths.
6. **Red/green integrity.**
   - A red commit must lint and typecheck. Add the interface plus a stub that throws `new Error('not implemented')`, so the tests fail on an assertion, not on a missing import.
   - The sub-agent pastes the failing output (red) and the passing output (green) into its report.
   - If a test passes on its first run, do not fake a red commit. Commit it as `test(...): add characterization test ...`.
   - Push to the remote only at a green phase boundary, because CI tests the branch head.
7. **Phase gate.** At the end of each phase the orchestrator runs on `main`: `npm run lint && npm run typecheck && npm run test:unit && npm run test:integration && npm run build`. Then it pushes.

---

## 7. Phased execution plan

**Root scripts** (Phase 0 defines them; everyone uses these names):
- `dev`: concurrently runs api and web.
- `lint`, `format`, `format:check`, `typecheck`.
- `test`: `test:unit` plus `test:web`.
- `test:unit`: api unit project plus shared.
- `test:integration`: api integration project.
- `test:web`, `test:e2e`, `test:coverage`, `test:report`.
- `build`, `db:up` (`docker compose up -d --wait`), `db:migrate`, `db:seed`.

### Phase 0: Foundation scaffold (sequential, 1 agent; it owns the lockfile)

**Tasks:**
- Root workspace and toolchain: `tsconfig.base.json`, `eslint.config.js` with the boundary rules, prettier, editorconfig, `.gitignore` (`node_modules`, `dist`, `coverage`, `.env`, `src/generated`, `playwright-report`, `test-results`), `.nvmrc`, husky and lint-staged.
- `docker-compose.yml` with `postgres:17-alpine`, `5433:5432`, user and password `kata`, db `kata_dev`, a healthcheck and an init SQL file that creates `kata_test` and `kata_e2e`.
- Each workspace `package.json` with all pinned dependencies, plus a stub source file and one smoke test so every script runs green.
- `apps/api/.env.example` and `.env.test`; `apps/web/.env.example`.
- `AGENTS.md`, covering the audit guardrails plus the parallel protocol in section 6.
- `docs/requirements.md` with the assumptions:
  - A vehicle is a listing with stock.
  - A purchase creates a record.
  - `PUT` cannot change quantity.
  - Archived vehicles are hidden and cannot be purchased.
  - Prices are in cents.
  - Validation errors use 400.
- README skeleton and `PROMPTS.md` stub.

**Commits:**
1. `chore: initialize npm workspaces monorepo with typescript, eslint and prettier`
2. `chore(db): add docker compose postgres with dev, test and e2e databases`
3. `chore(shared): scaffold shared contracts workspace`
4. `chore(api): scaffold express api workspace with vitest projects`
5. `chore(web): scaffold vite react tailwind workspace with vitest`
6. `chore(e2e): scaffold playwright workspace`
7. `docs: add AGENTS.md guardrails, requirements assumptions and readme skeleton`

**Verify:** `npm ci && npm run lint && npm run format:check && npm run typecheck && npm test && npm run db:up && docker compose exec db psql -U kata -lqt | cut -d'|' -f1` shows kata_dev, kata_test and kata_e2e.

### Phase 1: Contracts and platform

**Step 1A runs first and sequentially (1 agent, on `main`; small). Shared contracts:**
1. `test(shared): add failing tests for auth, vehicle and inventory contract schemas`. Cases: email normalization, password bounds, strict create, update rejecting quantity, search refine min>max, coercion, purchase default qty 1, uuid param.
2. `feat(shared): add zod contract schemas, enums and error codes`
3. `test(shared): add failing tests for money helpers`
4. `feat(shared): add cents formatting and string-based dollar-to-cents conversion`

**Then three tasks run in parallel, each in its own worktree.**

**1B Database.** Owns `apps/api/prisma/**`, `prisma.config.ts`, `src/infra/prisma.ts`, `test/global-setup.ts`, `test/integration-setup.ts`, `test/support/db.ts`, `test/integration/db-*.int.test.ts`.
1. `feat(db): add prisma schema and initial migration with pg_trgm search indexes`
2. `test(db): add failing integration tests for stock, price and purchase quantity check constraints`
3. `feat(db): enforce non-negative stock and price with check constraints`
4. `test(db): guard prisma enums against shared contract drift`. This is a characterization test; it should be green on its first run.
5. `chore(db): add integration test harness with per-run migrations and table truncation`

**1C API platform.** Owns `src/{config,core,http,openapi,infra/{bcrypt*,jose*,logger}}`, `app.ts`, `container.ts`, `server.ts`, `modules/index.ts`, `modules/health/**`, `test/support/{fakes/Fake*,test-app.ts}`. Health uses an injected `healthCheck`, so its HTTP tests do not need 1B.
1. `test(api): add failing tests for environment validation`
2. `feat(api): validate environment with zod at startup`
3. `test(api): add failing tests for mapping domain, validation and unknown errors to json responses`
4. `feat(api): add typed domain errors and centralized error handler`
5. `test(api): add failing http tests for health, unknown route, malformed json, body limit and security headers`
6. `feat(api): add app factory with helmet, cors allowlist, body limit and module registry`
7. `test(auth): add failing tests for bcrypt password hasher and jwt token service`
8. `feat(auth): implement bcryptjs password hasher and jose token service`
9. `test(auth): add failing tests for authenticate and requireRole middleware`
10. `feat(auth): add authenticate and requireRole middleware`
11. `test(api): add failing test for generated openapi document and swagger ui`
12. `feat(api): serve openapi document at /api/openapi.json and swagger ui at /api/docs`

**1D Web foundation.** Owns `apps/web/**`.
1. `feat(web): add design tokens and tailwind theme mapping`
2. `test(web): add failing tests for ui primitives`. Cases: Button loading and disabled; FormField wiring `aria-invalid` and `aria-describedby`; Dialog focus.
3. `feat(web): add minimal token-driven ui primitives`
4. `test(web): add failing tests for http client auth header and ApiError parsing`
5. `feat(web): add typed http client, ApiError and token storage`
6. `chore(web): add router shell, providers and msw test harness`

**Integration.** The orchestrator merges 1B, then 1C, then 1D. It wires `healthCheck` to `prisma.$queryRaw\`SELECT 1\`` in `container.ts`. Then it commits:
- `test(api): add failing integration test for health endpoint against database`, then `feat(api): wire database health check in composition root`
- `ci: add github actions workflow for lint, typecheck, unit and integration tests and web build`

**Verify:** the phase gate. Also:
- `npm run dev -w @kata/api`, then `curl -s localhost:4000/api/health` returns `{"status":"ok","db":"up"}`.
- `/api/docs` renders.
- `psql -h localhost -p 5433 -U kata kata_dev -c '\d vehicles'` lists the CHECK constraints and the GIN indexes.

### Phase 2: Feature wave 1 (3 parallel agents)

**2A Auth module.** Owns `modules/users/**`, `modules/auth/**`, `test/support/fakes/InMemoryUserRepository.ts`, `test/integration/auth*.int.test.ts`. Seam lines go in `container.ts` and `modules/index.ts`. Database: `kata_test_auth`.
1. `test(auth): add failing unit tests for user registration`. Cases: role USER, normalized email, hash stored and not returned, duplicate gives EMAIL_TAKEN, a token is issued.
2. `feat(auth): implement registration in AuthService`
3. `test(auth): add failing unit tests for login and profile lookup`. Cases: valid login; unknown email and wrong password both give INVALID_CREDENTIALS; missing user on getProfile.
4. `feat(auth): implement login with uniform invalid-credentials error and profile lookup`
5. `test(auth): add failing integration tests for register, login and me endpoints`
6. `feat(auth): add prisma user repository, auth controller, routes and openapi paths`
7. `test(auth): add failing integration test for auth rate limiting`
8. `feat(auth): rate limit register and login routes`
9. `refactor(auth): extract public user mapper and shared test factories`

**2B Vehicles module.** Owns `modules/vehicles/**`, `test/support/fakes/InMemoryVehicleRepository.ts`, `test/support/contracts/vehicle*`, `test/integration/vehicles*.int.test.ts`. Database: `kata_test_vehicles`.
1. `test(vehicles): add failing unit tests for creating and fetching vehicles`
2. `feat(vehicles): implement VehicleService create and getById`
3. `test(vehicles): add failing unit tests for updating and archiving vehicles`. Cases: 404 on missing or archived; archived vehicles are hidden from getById.
4. `feat(vehicles): implement update and soft-delete archive`
5. `test(vehicles): add failing repository contract tests for search filters, pagination and stable sorting`. Run against both the in-memory and Prisma repositories. Cases: case-insensitive partial make/model and `q`, exact category, inclusive price bounds, year, fuelType, archived excluded, id tiebreaker across pages.
6. `feat(vehicles): implement search in in-memory and prisma vehicle repositories`
7. `test(vehicles): add failing unit tests for list and search paging defaults and page metadata`
8. `feat(vehicles): implement list and search in VehicleService`
9. `test(vehicles): add failing integration tests for vehicle endpoints and permission matrix`. Cases: 401 without token; 403 for USER on POST, PUT and DELETE; 400 on bad body, bad uuid and quantity in PUT; 404; 204 delete then 404 on get.
10. `feat(vehicles): add vehicle controller, routes and openapi paths`
11. `refactor(vehicles): extract pagination helpers into core and simplify query mapping`

**2C Web auth.** Owns `apps/web/src/features/auth/**`, `components/layout/**`, `app/guards.tsx`, plus seam lines in `router.tsx`.
1. `test(web): add failing tests for login and register forms`. Cases: client validation, server errors EMAIL_TAKEN and INVALID_CREDENTIALS shown, redirect on success.
2. `feat(web): implement login and register forms with react-hook-form and shared schemas`
3. `test(web): add failing tests for auth provider and route guards`
4. `feat(web): add auth provider, useAuth, RequireAuth and RequireAdmin`
5. `feat(web): add app shell with role-aware navigation and logout`

**Verify:** the phase gate. Also, in Swagger UI, register, then log in, then call `GET /api/vehicles` with the token. Expect 200 for a user and 403 when a user tries `POST /api/vehicles`.

### Phase 3: Feature wave 2 (3 parallel agents)

**3A Inventory module.** Owns `modules/inventory/**`, `infra/prisma-unit-of-work.ts`, fakes for the purchase repository and unit of work, `contracts/purchase*`, `test/integration/inventory*.int.test.ts` and `concurrency.int.test.ts`. It may add `decrementStockIfAvailable` and `incrementStock` to the vehicle repository files. That is a known overlap with the vehicles module, so 3A must run after 2B has merged. Database: `kata_test_inventory`.
1. `test(inventory): add failing unit tests for purchasing a vehicle`. Cases: default qty 1, explicit qty, unit price snapshot, stock decremented, 409 with details, 404 on missing or archived, rollback leaves stock unchanged when the purchase insert fails.
2. `feat(inventory): implement purchase with unit of work, price snapshot and stock checks`
3. `test(inventory): add failing unit tests for restock and purchase history`
4. `feat(inventory): implement restock and listMyPurchases`
5. `test(inventory): add failing repository contract tests for conditional stock decrement and increment`
6. `feat(inventory): implement conditional decrement, increment and prisma unit of work`
7. `test(inventory): add failing integration tests for purchase, restock and purchase history endpoints including concurrent purchase of the last unit`. Concurrency test: stock 1, create 10 users, open `server = app.listen(0)`, fire `Promise.all` of 10 purchases. Assert exactly one 201 and nine 409, `quantity === 0` and `purchases.count === 1`. Second case: stock 3 with 8 concurrent purchases gives exactly 3 successes.
8. `feat(inventory): add inventory controller, routes and openapi paths`
9. `refactor(inventory): consolidate dto mapping and error details`

**3B Web vehicles.** Owns `apps/web/src/features/vehicles/**`.
1. `test(web): add failing tests for vehicle grid, card, loading, empty and error states`
2. `feat(web): implement dashboard with paginated vehicle grid`. `VehicleCard` exposes an `actions` slot for later phases.
3. `test(web): add failing tests for search filters synced to url params`
4. `feat(web): implement search and filter panel with debounced text input`
5. `test(web): add failing tests for admin vehicle form validation and delete confirmation`
6. `feat(web): implement admin vehicle list, create, edit and delete`

**3C Seed.** Owns `apps/api/prisma/seed.ts` and `test/integration/seed.int.test.ts`. The seed logic is exported as `runSeed(prisma, env)` so it can be tested.
1. `test(db): add failing integration test for idempotent seed`. Running it twice yields one admin and no duplicate vehicles.
2. `feat(db): add seed script creating admin from env and sample vehicles`

**Verify:** the phase gate, with `npm run test:integration` including the concurrency test. Also `npm run db:migrate && npm run db:seed`, then log in as the admin through `/api/docs`.

### Phase 4: Feature wave 3 and hardening (3 parallel agents)

**4A Web inventory.** Owns `apps/web/src/features/inventory/**`, plus seam lines in `router.tsx` and the `VehicleCard` actions wiring.
1. `test(web): add failing tests for purchase button disabled at zero stock, pending state and insufficient-stock error`
2. `feat(web): implement purchase button updating cached stock from the response`
3. `test(web): add failing tests for restock dialog and purchase history page`
4. `feat(web): implement admin restock dialog and my purchases page`

**4B API hardening.** Owns `http/**`, `openapi/**` and `test/integration/openapi*.int.test.ts`.
1. `test(api): add failing test that every mounted route is documented in openapi`
2. `feat(api): complete openapi documentation for all routes`
3. `test(api): add failing test that logs redact authorization headers and passwords`
4. `feat(api): add structured request logging with redaction`
5. `refactor(api): ...` only if real duplication is found. A security-review pass happens here.

**4C Docs.** Owns `docs/architecture.md` and `docs/adr/*`. Commit: `docs: add architecture overview and architecture decision records`. ADRs:
- 0001 monorepo with npm workspaces
- 0002 layered modular Express
- 0003 Postgres, Prisma and integer cents
- 0004 soft delete
- 0005 shared Zod contracts and OpenAPI
- 0006 JWT bearer tokens and roles (why not cookies, against the audit)
- 0007 atomic conditional-decrement purchase
- 0008 testing strategy (fakes, contract tests, real-DB integration)
- 0009 frontend feature layers and design tokens
- 0010 deployment on Vercel, Render and Neon

**Then, sequentially:** the orchestrator runs the full stack (`npm run dev`) for a manual smoke test and commits `fix(...)` for anything found.

### Phase 5: E2E, coverage and test report (sequential, 1 agent; touches CI)

1. `test(e2e): add playwright config with seeded e2e database and web servers`
2. `test(e2e): cover register, login, search and purchase flow`
3. `test(e2e): cover zero-stock disabled purchase and admin create, edit, restock and delete`
4. `ci: add e2e job, coverage thresholds and report artifacts`. Coverage thresholds:
   - API: 90% lines on `modules/**/*.service.ts`, 80% overall.
   - Web: 70%.
   - Exclude `src/generated`, `test/**` and `main.tsx`.
5. `chore: add test report generator`, then `docs: add generated test report`.

**Verify:** `npm run test:e2e` and `npm run test:report` produce `docs/test-report.md`, and CI is green.

### Phase 6: UI re-skin (blocked on the user's design)

- One agent changes only `styles/tokens.css`, `components/ui/**` and `components/layout/**`.
- Commit `feat(web): apply glass-neumorphic design system`, then `docs: add application screenshots`.
- **Verify:**
  - `git diff --stat` shows no files under `features/` or `lib/`.
  - Web tests are still green; they query by role and label, so they survive a re-skin.
  - E2E is green.

### Phase 7: Deployment and final docs (sequential)

1. `chore(deploy): add render blueprint and vercel spa config`. Render settings:
   - Build: `npm ci && npm run build -w @kata/api`.
   - Start: `npm run db:migrate:deploy -w @kata/api && node apps/api/dist/server.js`. Use Render's pre-deploy command instead if the plan supports it.
   - Health check path: `/api/health`.
   - Environment: `TRUST_PROXY=1` and `CORS_ORIGINS=https://<app>.vercel.app`.
   - `DATABASE_URL` is Neon's pooled URL; `DIRECT_DATABASE_URL` is Neon's direct URL. Both use `?sslmode=require`.

   Vercel: root directory `apps/web`, `VITE_API_URL=https://<api>.onrender.com`.
2. Seed production once from a local machine using the Neon direct URL and `SEED_ADMIN_*`.
3. `docs: add deployment guide and live links`
4. `docs: complete readme with setup, test report, screenshots and my ai usage`
5. `docs: add raw ai prompt logs to PROMPTS.md`. Include verbatim exports of the session transcripts, scrubbed only for secrets. No summaries.
6. Tag `v1.0.0`.

**Verify:** smoke-test the live site (register, purchase, admin restock) and confirm the CORS preflight succeeds from the Vercel origin.

### Parallelism summary

| Phase | Sequential | Parallel |
|---|---|---|
| 0 | everything (lockfile owner) | none |
| 1 | 1A shared, then the merge and CI wiring | 1B DB ‖ 1C API platform ‖ 1D web foundation |
| 2 | merge order: 2A, 2B, 2C | 2A auth ‖ 2B vehicles ‖ 2C web auth |
| 3 | 3A starts only after 2B is merged | 3A inventory ‖ 3B web vehicles ‖ 3C seed |
| 4 | the smoke test after the merge | 4A web inventory ‖ 4B API hardening ‖ 4C docs |
| 5–7 | all of it | none |

---

## 8. Environment variables

**API** (validated in `config/env.ts`):

| Variable | Rule |
|---|---|
| `NODE_ENV` | development, test or production |
| `PORT` | default 4000 |
| `DATABASE_URL` | required |
| `DIRECT_DATABASE_URL` | optional; used for migrations |
| `JWT_SECRET` | at least 32 characters |
| `JWT_EXPIRES_IN` | default `1h` |
| `BCRYPT_COST` | 4–15, default 12; 4 in `.env.test` |
| `CORS_ORIGINS` | comma-separated; required in production |
| `AUTH_RATE_LIMIT_MAX` | default 20 per 15 minutes; high in tests |
| `TRUST_PROXY` | default 0 |
| `LOG_LEVEL` | |

The seed has its own schema: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`.

**Web:** `VITE_API_URL`. Leave it empty in development so Vite proxies `/api` to `localhost:4000`.

---

## 9. Risks and pitfalls

1. **Prisma 7 differences.**
   - The `prisma-client` generator requires an `output` path.
   - The datasource URL moves to `prisma.config.ts`.
   - A driver adapter (`@prisma/adapter-pg`) is required.
   - `.env` is not loaded automatically, so use `dotenv-cli` in scripts.
   - `migrate dev` no longer runs `generate` or the seed, so run them explicitly (`postinstall` runs generate).
   - In CI, set `DATABASE_URL` at job level so the config evaluates during `postinstall`.
   - Never accept the npm `latest` tag (8.0.0-rc).
2. **Prisma and Vitest with a shared test database.**
   - The integration project needs `fileParallelism: false` and `pool: 'forks'`.
   - Truncate in `beforeEach`, migrate in `globalSetup`, `$disconnect` in `afterAll`.
   - Use a separate database per parallel worktree.
   - Unit tests never touch Prisma.
   - The concurrency test needs pool size ≥ request count (the pg default is 10) and should use one `listen(0)` server.
3. **ESM and CJS.**
   - Everything is ESM with `moduleResolution: Bundler`, and tsup bundles for production.
   - `jose` and `bcryptjs` avoid CJS and native-build problems.
   - `swagger-ui-express` is CJS but works with a default import.
   - Never mix `.js` import extensions; the bundler resolution makes them unnecessary.
4. **Hoisting and duplicate zod.** A second copy of zod silently breaks `instanceof ZodError` and shared-schema identity. Pin the same exact version everywhere and add `npm ls zod` to the CI quality job; it fails on non-deduped copies. The custom Prisma output path avoids the classic hoisted `.prisma/client` problem.
5. **Express 5 behaviour.**
   - `req.query` is a read-only getter, so parse it into a local variable instead of reassigning.
   - `req.body` is undefined when there is no body.
   - path-to-regexp v8 syntax: use `/*splat`, not `*`.
6. **Rate limiting behind a proxy.** `express-rate-limit` v8 throws a validation error when `X-Forwarded-For` arrives and `trust proxy` is off. Set `TRUST_PROXY=1` on Render only.
7. **CORS between Vercel and Render.**
   - The allowlist needs the exact origin, with no trailing slash.
   - Vercel preview URLs change on every deploy. Either test against production only or add an optional `CORS_ORIGIN_REGEX`.
   - Bearer auth means `credentials: false`. Make sure the `Authorization` header is allowed in preflight.
   - Helmet's CSP can block Swagger UI assets. Mount `/api/docs` with a relaxed CSP.
8. **Render free tier.** Cold starts take about 50 seconds, so the web app needs a visible loading and retry state. `VITE_API_URL` is baked in at build time, so changing it requires a Vercel redeploy. Neon needs `sslmode=require`; run migrations through the direct URL, not the pooler.
9. **Red commits.** A pre-commit hook that runs tests would block red commits, so hooks only format and lint. Push only at green boundaries, or CI shows red on main.
10. **Parallel agents.** Lockfile churn and a shared git index are the main ways to lose work. Section 6 rules 1–3 are mandatory. Each worktree needs its own `npm ci`, which also runs `prisma generate`.
11. **Data correctness.**
    - bcrypt truncates at 72 bytes, so enforce a maximum of 72 characters.
    - Convert dollars to cents through string parsing, never `Math.round(x*100)` on floats.
    - Validate the year against `currentYear+1` at parse time.
    - The enum-drift test keeps Prisma enums and shared enums identical.
12. **Port clash.** A local Postgres on 5432 is likely, so Compose uses 5433. Every `.env*` file must match.
13. **Web tests.**
    - Use a new `QueryClient` per test with `retry: false`.
    - MSW `onUnhandledRequest: 'error'`.
    - If MSW 3 plus jsdom shows AbortSignal or fetch realm errors, switch the Vitest environment to `happy-dom` rather than polyfilling.
14. **Coverage noise.** Exclude `src/generated/**`, `test/**`, `server.ts` and `main.tsx`, or the thresholds become meaningless.
15. **Trailer wording.** The spec example uses `Co-authored-by` with "two empty lines". Git trailers are case-insensitive and GitHub recognises both, so the locked `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` after a blank line is valid. Keep it identical on every commit.
16. **E2E isolation.** E2E uses `kata_e2e`, which is reset and seeded in `global-setup`, with unique emails per test. Never point it at `kata_test`, because integration runs truncate that database.

### Critical Files for Implementation
- /Users/saii/Downloads/assignment/KATA/apps/api/src/container.ts
- /Users/saii/Downloads/assignment/KATA/apps/api/prisma/schema.prisma
- /Users/saii/Downloads/assignment/KATA/packages/shared/src/schemas/vehicle.ts
- /Users/saii/Downloads/assignment/KATA/apps/api/src/modules/inventory/inventory.service.ts
- /Users/saii/Downloads/assignment/KATA/apps/api/vitest.config.ts