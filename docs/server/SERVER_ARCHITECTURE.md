# Ikki ERP Server - Architecture Guide

> ⚠️ For the current, authoritative module pattern (repo ports, `undefined`
> not-found, explicit-`db` `checkConflict`, `withTransaction`, unit-first
> tests) see **[MODULE_STANDARD.md](./MODULE_STANDARD.md)** and the reference
> modules `location/` (simple) and `iam/` (complex). This guide gives the
> broader system context; where it conflicts with MODULE_STANDARD.md, that file wins.

**Version**: 1.1  
**Last Updated**: 2026-07-05  
**Target**: Solo developer with AI-assisted development

---

## 🎯 Design Philosophy

This codebase is optimized for:

1. **Solo developer velocity** - minimal ceremony, flat when possible
2. **AI agent comprehension** - predictable structure, explicit patterns
3. **Scalability** - grows with features without major refactors
4. **Type safety** - TypeScript + Zod validation everywhere

---

## 📐 Project Structure

```
apps/server/
├── drizzle/                    # Auto-generated migrations
├── scripts/                    # Utility scripts (seed, helpers)
│   ├── db-scripts-helper.ts
│   └── seed-*.ts
│
├── src/
│   ├── server.ts              # Entry point (Bun.serve)
│   ├── app.ts                 # Elysia app instance
│   │
│   ├── config/                # Environment & constants
│   │   ├── env.ts             # Validated env vars (Zod)
│   │   └── seed-config.ts
│   │
│   ├── db/                    # Database layer
│   │   ├── index.ts           # Export all schemas + client
│   │   └── schema/            # Drizzle table definitions
│   │       ├── core.ts        # users, sessions, audit_logs
│   │       ├── iam.ts         # roles, permissions, assignments
│   │       ├── inventory.ts   # materials, stock, locations
│   │       └── ...            # Group by domain
│   │
│   ├── infra/                 # Infrastructure services
│   │   ├── database/          # DB utilities
│   │   │   ├── index.ts       # DbContext type
│   │   │   ├── pagination.ts  # paginate() helper
│   │   │   ├── conflict-checker.ts
│   │   │   ├── query-builder.ts
│   │   │   └── utils.ts
│   │   ├── cache/             # BentoCache wrapper
│   │   │   ├── index.ts
│   │   │   ├── cache.service.ts
│   │   │   └── config.ts
│   │   ├── logger/            # LogTape wrapper
│   │   │   └── index.ts
│   │   └── otel/              # OpenTelemetry
│   │       └── otel.ts
│   │
│   ├── shared/                # Shared utilities
│   │   ├── audit/             # Audit helpers
│   │   │   └── stamp.ts       # stampCreate/stampUpdate
│   │   ├── errors/            # Custom errors
│   │   │   ├── app-error.ts
│   │   │   └── http-error.ts  # NotFoundError, ConflictError, etc.
│   │   ├── schema/            # Zod primitives
│   │   │   └── index.ts       # zp (primitives), zc (common), zq (query)
│   │   └── utils/             # Pure functions
│   │       ├── relation-map.ts
│   │       └── password.ts
│   │
│   ├── types/                 # Global types
│   │   ├── pagination.ts
│   │   ├── utils.ts           # ActorId, EntityRef
│   │   ├── elysia.d.ts
│   │   ├── zod.d.ts
│   │   └── global.d.ts
│   │
│   ├── modules/               # Feature modules (vertical slices)
│   │   ├── _registry.ts       # DI container
│   │   ├── _routes.ts         # Route aggregator
│   │   │
│   │   ├── iam/               # IAM Module (complex, has submodules)
│   │   │   ├── iam.module.ts  # Module factory
│   │   │   ├── iam.route.ts   # Aggregate routes
│   │   │   ├── index.ts       # Public exports
│   │   │   ├── constants.ts   # Module constants
│   │   │   │
│   │   │   ├── user/          # User submodule
│   │   │   │   ├── user.contract.ts  # Zod schemas
│   │   │   │   ├── user.repo.ts      # DB queries
│   │   │   │   └── user.service.ts   # Business logic
│   │   │   │
│   │   │   ├── role/          # Role submodule
│   │   │   │   ├── role.contract.ts
│   │   │   │   ├── role.repo.ts
│   │   │   │   └── role.service.ts
│   │   │   │
│   │   │   ├── assignment/    # User-role assignments
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── composed/      # Cross-submodule queries
│   │   │       ├── composed.repo.ts
│   │   │       └── composed.service.ts
│   │   │
│   │   ├── location/          # Location module (simple, flat)
│   │   │   ├── location.module.ts
│   │   │   ├── location.contract.ts
│   │   │   ├── location.repo.ts
│   │   │   ├── location.service.ts
│   │   │   ├── location.route.ts
│   │   │   ├── location.internal.ts  # Internal errors
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/              # Authentication
│   │   │   └── ...
│   │   │
│   │   └── ...                # Other modules
│   │
│   └── tests/
│       ├── setup.ts           # Test environment
│       └── helpers/           # Test utilities
│           ├── test-client.ts
│           └── token-store.ts
│
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

---

## 🏗️ Architecture Layers

### **Layer 0: Infrastructure** (`infra/`)

Core services that modules depend on.

```
infra/
├── database/    # DB context, pagination, conflict checking
├── cache/       # BentoCache wrapper
├── logger/      # LogTape wrapper
└── otel/        # OpenTelemetry tracing
```

**Rules:**

- No business logic
- Pure technical concerns
- Modules depend on this, NOT vice versa

---

### **Layer 1: Shared** (`shared/`)

Domain-agnostic utilities used across modules.

```
shared/
├── audit/       # stampCreate, stampUpdate
├── errors/      # Custom error classes
├── schema/      # Zod primitives (zp, zc, zq)
└── utils/       # Pure functions (RelationMap, password)
```

**Rules:**

- No module-specific logic
- Stateless functions
- Can import from `infra/` and `types/`

---

### **Layer 2: Database Schema** (`db/`)

Drizzle table definitions grouped by domain.

```
db/schema/
├── core.ts        # users, sessions, audit_logs
├── iam.ts         # roles, permissions, user_assignments
├── inventory.ts   # materials, stock, locations
└── ...
```

**Rules:**

- One file per domain (e.g., `iam.ts` contains roles + permissions + assignments)
- Export all from `db/index.ts`
- No business logic (just schema definitions)

---

### **Layer 3: Modules** (`modules/`)

Vertical slices of business logic. **THE CORE OF THE APP.**

```
modules/
├── _registry.ts      # DI container (createModules)
├── _routes.ts        # Route aggregator
└── {module}/
    ├── {module}.module.ts    # Factory function
    ├── {module}.contract.ts  # Zod schemas
    ├── {module}.repo.ts      # DB queries (Drizzle)
    ├── {module}.service.ts   # Business logic
    ├── {module}.route.ts     # HTTP routes (Elysia)
    └── index.ts              # Public exports
```

**Two Types of Modules:**

#### **A) Simple Module** (single entity, no submodules)

Example: `location/`, `auth/`

```
location/
├── location.module.ts    # createLocationModule()
├── location.contract.ts  # LocationDto, LocationCreateDto, etc.
├── location.repo.ts      # LocationRepo class
├── location.service.ts   # LocationService class
├── location.route.ts     # Elysia routes
├── location.internal.ts  # Internal errors/types
└── index.ts              # Export LocationModule type
```

#### **B) Complex Module** (multiple entities, has submodules)

Example: `iam/` (user, role, assignment)

```
iam/
├── iam.module.ts     # createIamModule() - orchestrates submodules
├── iam.route.ts      # Aggregate routes from submodules
├── index.ts          # Export IamModule type
├── constants.ts      # Module-wide constants
│
├── user/             # User submodule
│   ├── user.contract.ts
│   ├── user.repo.ts
│   └── user.service.ts
│
├── role/             # Role submodule
│   └── ...
│
├── assignment/       # User-role assignment submodule
│   └── ...
│
└── composed/         # Cross-submodule queries (JOIN-heavy)
    ├── composed.repo.ts
    └── composed.service.ts
```

---

## 🔄 Data Flow

```
HTTP Request
    ↓
[Route Handler] (*.route.ts)
    ↓ validates input with Zod
[Service] (*.service.ts)
    ↓ orchestrates business logic
[Repo] (*.repo.ts)
    ↓ executes DB queries
[Database] (Drizzle ORM)
    ↓
PostgreSQL
```

**Key Points:**

- **Routes** are thin wrappers (validate → call service → return)
- **Services** contain ALL business logic (cache, transactions, orchestration)
- **Repos** are PURE data access (no if/else, no throw, just DB queries)

---

## 🧱 Module Anatomy

### **1. Contract** (`*.contract.ts`)

Zod schemas for validation + TypeScript types.

```ts
// location.contract.ts
import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

// Entity DTO (what comes OUT of the DB) — use zp.* (raw, no coercion)
export const LocationDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: LocationTypeEnum,
	description: zp.str.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape, // createdAt, updatedAt, createdBy, updatedBy
})
export type LocationDto = z.infer<typeof LocationDto>

// Filter DTO (GET list) — pagination + search
export const LocationFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: LocationTypeEnum.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>

// Reusable mutation shape — use zc.* (trimmed / validated input)
const LocationMutationDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	description: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})

// Create DTO (HTTP POST)
export const LocationCreateDto = LocationMutationDto
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

// Update DTO (HTTP PUT) — id inline as `id: zp.id`
export const LocationUpdateDto = z.object({
	id: zp.id,
	...LocationMutationDto.shape,
})
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>
```

**Pattern:**

- Use spread-shape (`.shape`) instead of `.extend()` for Zod composition.
- Output DTOs use `zp.*`; mutation DTOs use `zc.*`; query params use `zq.*` (coerced).
- Separate mutation logic into a reusable `{Entity}MutationDto`.
- Always include audit fields via `...zc.AuditBasic.shape`.
- Write the id field inline (`id: zp.id`), not `...zc.RecordId.shape`.
- Full rules: **[MODULE_STANDARD.md § 7](./MODULE_STANDARD.md)**.

---

### **2. Repository** (`*.repo.ts`)

Pure data access layer. **NO business logic.** Declare an `I{Module}Repo`
**port** (interface); the service depends on the port, not the class.

```ts
// location.repo.ts
import { eq, inArray } from 'drizzle-orm'
import type { DbContext } from '@/infra/database'
import { locationsTable } from '@/db/schema'
import type { EntityRef } from '@/types/utils'
import type { LocationDto, LocationFilterDto } from './location.contract'

export interface ILocationRepo {
	readonly db: DbContext
	findMany(filter?: LocationFilterDto, db?: DbContext): Promise<LocationDto[]>
	findById(id: number, db?: DbContext): Promise<LocationDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<LocationDto[]>
	insert(data: LocationInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class LocationRepo implements ILocationRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db): Promise<LocationDto | undefined> {
		return db
			.select()
			.from(locationsTable)
			.where(eq(locationsTable.id, id))
			.then((rows) => rows[0]) // undefined when empty
	}

	async findByIds(ids: number[], db: DbContext = this.db): Promise<LocationDto[]> {
		if (ids.length === 0) return []
		return db.select().from(locationsTable).where(inArray(locationsTable.id, ids))
	}

	async insert(data: LocationInsert, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db.insert(locationsTable).values(data).returning({ id: locationsTable.id })
		return res
	}

	async remove(id: number, db: DbContext = this.db): Promise<EntityRef | undefined> {
		const [res] = await db
			.delete(locationsTable)
			.where(eq(locationsTable.id, id))
			.returning({ id: locationsTable.id })
		return res
	}
}
```

**Rules:**

- Declare an `I{Module}Repo` **port**; services depend on the port, not the class.
- Reads return `T | undefined` for not-found — **never `null`, never throw**.
- Writes return `EntityRef | undefined` (`{ id }`), not the full row.
- Every write accepts an optional `db?: DbContext = this.db` for transactions.
- Read verbs: `findMany / findById / findByIds / findPage`. Writes: `insert / insertMany / update / remove`.
- Use batch ops (`inArray`) instead of loops; guard empty arrays.

---

### **3. Service** (`*.service.ts`)

Business logic orchestrator. **THIS IS WHERE THE MAGIC HAPPENS.**

```ts
// location.service.ts
import { record } from '@elysiajs/opentelemetry'
import { locationsTable } from '@/db/schema'
import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { ActorId, EntityRef } from '@/types/utils'
import { LocationError } from './location.internal'
import type { ILocationRepo } from './location.repo'
import type { LocationCreateDto, LocationUpdateDto } from './location.contract'

const uniqueFields: ConflictField<{ name: string; code: string }>[] = [
	{ field: 'name', column: locationsTable.name, message: 'Location name already exists', code: 'LOCATION_NAME_ALREADY_EXISTS' },
	{ field: 'code', column: locationsTable.code, message: 'Location code already exists', code: 'LOCATION_CODE_ALREADY_EXISTS' },
]

export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ILocationRepo, // depend on the PORT
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	/** Private cache-bust helper — every mutation calls this. */
	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	// `handleX` are the ONLY methods routes call. The telemetry span is wrapped
	// at ONE level (here), not also in the internal method.
	async handleCreate(data: LocationCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleCreate', async () => {
			await checkConflict({
				db: this.repo.db, // explicit db — no global fallback
				table: locationsTable,
				pkColumn: locationsTable.id,
				fields: uniqueFields,
				input: data,
			})

			const result = await this.repo.insert({ ...data, ...stampCreate(actorId) })
			if (!result) throw LocationError.createFailed()

			await this.invalidate()
			return result
		})
	}

	async handleGetById(id: number): Promise<LocationDto> {
		return record('LocationService.handleGetById', async () => {
			const found = await this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			})
			if (!found) throw LocationError.notFound(id) // service turns undefined → typed error
			return found
		})
	}
}
```

**Rules:**

- Public methods use the `handleX` prefix — the only entrypoints routes call.
- Internal reuse methods use plain verbs (`create`, `getById`).
- Wrap the telemetry span with `record('...', async () => …)` at **one** level only.
- `checkConflict({ db: this.repo.db, … })` — always pass an explicit `db`.
- Repos return `undefined`; the **service** translates it to a typed `{Module}Error`.
- Every mutation stamps the actor (`stampCreate`/`stampUpdate`) and calls `invalidate()`.
- Multi-write ops must be atomic via `withTransaction(this.repo.db, tx => …)`.
- Full rules: **[MODULE_STANDARD.md § 2–4](./MODULE_STANDARD.md)**.

---

### **4. Module Factory** (`*.module.ts`)

DI container for the module.

```ts
// location.module.ts
import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'
import { LocationRepo } from './location.repo'
import { LocationService } from './location.service'

// A leaf module's public type IS its service.
export type LocationModule = LocationService

export function createLocationModule(db: DbContext, cacheClient: CacheClient): LocationModule {
	const repo = new LocationRepo(db)
	return new LocationService(repo, cacheClient)
}
```

**For complex modules with dependencies:**

```ts
// iam.module.ts
interface Deps {
	location: LocationModule
}

export interface IamModule {
	role: RoleService
	assignment: UserAssignmentService
	user: UserService
	composed: IamComposedService
}

export function createIamModule(db: DbContext, cacheClient: CacheClient, deps: Deps): IamModule {
	// Create repos
	const roleRepo = new RoleRepo(db)
	const userRepo = new UserRepo(db)
	const assignmentRepo = new UserAssignmentRepo(db)
	const composedRepo = new IamComposedRepo(db)

	// Create services, injecting narrow deps (not whole modules)
	const role = new RoleService(roleRepo, cacheClient)
	const assignment = new UserAssignmentService(assignmentRepo, cacheClient)
	const user = new UserService({ location: deps.location, assignment }, userRepo, cacheClient)
	const composed = new IamComposedService(
		{ role, assignment, user, location: deps.location },
		composedRepo,
	)

	return { role, assignment, user, composed }
}
```

---

### **5. Routes** (`*.route.ts`)

HTTP layer (Elysia).

```ts
// location.route.ts
import { Elysia } from 'elysia'
import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'
import { LocationCreateDto, LocationDto, LocationFilterDto, LocationUpdateDto } from './location.contract'
import type { LocationModule } from './location.module'

export function createLocationRoute(m: LocationModule) {
	return new Elysia({ prefix: '/location' })
		.use(authPluginMacro)
		// List (paginated)
		.get(
			'/list',
			async ({ query }) => res.paginated(await m.handleList(query)),
			{ query: LocationFilterDto, response: createPaginatedResponseDto(LocationDto), auth: true },
		)
		// Detail — {id} via query, coerced with zq.recordId
		.get(
			'/detail',
			async ({ query }) => res.ok(await m.handleGetById(query.id)),
			{ query: zq.recordId, response: createSuccessResponseDto(LocationDto), auth: true },
		)
		// Create — actor from auth.userId
		.post(
			'/create',
			async ({ body, auth }) => res.created(await m.handleCreate(body, auth.userId)),
			{ body: LocationCreateDto, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		// Update
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await m.handleUpdate(body, auth.userId)),
			{ body: LocationUpdateDto, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		// Remove — {id} via query
		.delete(
			'/remove',
			async ({ query }) => res.ok(await m.handleDelete(query.id)),
			{ query: zq.recordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
```

**Rules:**

- One `create{Module}Route(m: {Module}Module)` factory returning `new Elysia({ prefix })`.
- `.use(authPluginMacro)` once; guard each endpoint with `auth: true`.
- Routes are THIN: validate → call one `handleX` → wrap in `res.*`.
- Wrap responses: `res.paginated` (list), `res.ok` (detail/update/remove), `res.created` (create).
- Declare a `response:` DTO (`createSuccessResponseDto` / `createPaginatedResponseDto`).
- `detail`/`remove` take `{ id }` via **query** using `zq.recordId` (coerced).
- Actor comes from `auth.userId` (injected by `authPluginMacro`).
- Complex modules split into per-entity sub-routes composed by the aggregate route
  (see `iam.route.ts` → `roleRoute` + `userRoute`).

---

## 🔗 Module Dependencies

Modules follow a **strict dependency hierarchy** to prevent circular imports:

```
Layer 3: Aggregators (Dashboard, Reporting)
    ↓
Layer 2: Operations (Sales, Purchasing, Production)
    ↓
Layer 1: Master Data (IAM, Location, Material, Product)
    ↓
Layer 0: Core (Auth, Session)
```

**Rules:**

1. **Lower layers CANNOT import from upper layers**
2. **Same-layer modules CAN import each other** (but avoid cycles)
3. **Use `composed/` submodules for cross-cutting queries**

**Example:**

```ts
// ✅ GOOD: Sales (Layer 2) depends on Product (Layer 1)
import { ProductService } from '@/modules/product'

// ❌ BAD: Product (Layer 1) depends on Sales (Layer 2)
import { SalesService } from '@/modules/sales' // CIRCULAR!

// ✅ SOLUTION: Extract shared logic to composed/ or a lower layer
```

---

## 🧪 Testing Strategy

Unit-first. Full rules: **[MODULE_STANDARD.md § 5](./MODULE_STANDARD.md)**.

### **Unit Tests** (`src/tests/unit/*.service.test.ts`)

Instantiate the service with a **typed in-memory fake** implementing the repo
port — no DB, no `as any`.

```ts
// src/tests/unit/location.service.test.ts
import { describe, it, expect } from 'bun:test'
import { LocationService } from '@/modules/location/location.service'
import type { ILocationRepo } from '@/modules/location/location.repo'

function fakeRepo(overrides: Partial<ILocationRepo> = {}): ILocationRepo {
	return {
		db: { select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }) } as never,
		findMany: async () => [],
		findById: async () => undefined,
		findByIds: async () => [],
		insert: async () => ({ id: 1 }),
		update: async () => ({ id: 1 }),
		remove: async () => ({ id: 1 }),
		...overrides,
	}
}

describe('LocationService', () => {
	it('creates a location', async () => {
		const service = new LocationService(fakeRepo(), fakeCache)
		const result = await service.handleCreate(
			{ code: 'ST-01', name: 'Main Store', type: 'store', description: null, address: null, phone: null, isActive: true },
			1,
		)
		expect(result).toEqual({ id: 1 })
	})
})
```

### **Integration Tests** (`src/tests/services/*.test.ts`)

Build the real module graph via `testCtx.m.*` against the test DB for critical
HTTP/business flows (reference: `iam.test.ts`). Assert async rejection with the
`expectReject(promise)` helper.

---

## 📦 Import Path Aliases

```json
{
	"compilerOptions": {
		"paths": {
			"@/*": ["./src/*"],
			"@/db": ["./src/db"],
			"@/infra/*": ["./src/infra/*"],
			"@/shared/*": ["./src/shared/*"],
			"@/modules/*": ["./src/modules/*"],
			"@/types/*": ["./src/types/*"]
		}
	}
}
```

---

## 🚦 Code Review Checklist

Before submitting code, verify:

- [ ] No circular dependencies (`bun run check-deps`)
- [ ] All tests pass (`bun test`)
- [ ] Type checking passes (`bun run typecheck`)
- [ ] Linter passes (`bun run lint`)
- [ ] All mutations have audit stamps (`createdBy`, `updatedBy`)
- [ ] All mutations invalidate cache
- [ ] All unique fields have conflict checks
- [ ] All services use `handleX` for public methods
- [ ] All repos return `undefined` (not `null`, not throw) for not found
- [ ] All routes are thin (just validate + call service)

---

## 🎓 Next Steps

1. Read [CODE_PATTERNS.md](./CODE_PATTERNS.md) for concrete examples
2. Read [MODULE_CHECKLIST.md](./MODULE_CHECKLIST.md) for step-by-step guide
3. Read the reference modules (`location/`, `iam/`) and [MODULE_STANDARD.md](./MODULE_STANDARD.md)

---

**Questions?** Check existing modules (`iam/`, `location/`) as reference implementations.
