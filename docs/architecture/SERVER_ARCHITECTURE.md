# Ikki ERP Server - Architecture Guide

> ⚠️ For the current, authoritative module pattern (repo ports, `undefined`
> not-found, explicit-`db` `checkConflict`, `withTransaction`, unit-first
> tests) see **[MODULE_STANDARD.md](./MODULE_STANDARD.md)** and the reference
> modules `location/` (simple) and `iam/` (complex). This guide gives the
> broader system context; where it conflicts with MODULE_STANDARD.md, that file wins.

**Version**: 1.0  
**Last Updated**: 2026-06-22  
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
│   │   │   └── index.ts       # zp (primitives), zc (common)
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
├── schema/      # Zod primitives (zp, zc)
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
import { zc, zp } from '@/shared/schema'

// Entity DTO (what comes OUT of DB)
export const LocationDto = z.object({
	id: zp.id,
	name: zp.str,
	code: zp.str,
	type: z.enum(['WAREHOUSE', 'STORE', 'SUPPLIER']),
	...zc.AuditBasic.shape, // createdAt, updatedAt, etc.
})
export type LocationDto = z.infer<typeof LocationDto>

// Mutation DTO (reusable shape for CREATE/UPDATE)
const LocationMutationDto = z.object({
	name: zc.name,
	code: zc.code,
	type: z.enum(['WAREHOUSE', 'STORE', 'SUPPLIER']),
})

// Create DTO (HTTP POST)
export const LocationCreateDto = z.object({
	...LocationMutationDto.shape,
})
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

// Update DTO (HTTP PATCH)
export const LocationUpdateDto = z.object({
	...zc.RecordId.shape, // { id: number }
	...LocationMutationDto.shape,
})
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>

// Filter DTO (HTTP GET list with filters)
export const LocationFilterDto = z.object({
	...zc.PaginationQuery.shape,
	type: z.enum(['WAREHOUSE', 'STORE', 'SUPPLIER']).optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
```

**Pattern:**

- Use spread-shape (`.shape`) instead of `.extend()` for Zod composition
- Separate mutation logic into reusable `{Entity}MutationDto`
- Always include audit fields via `zc.AuditBasic.shape`

---

### **2. Repository** (`*.repo.ts`)

Pure data access layer. **NO business logic.**

```ts
// location.repo.ts
import { eq, and, inArray } from 'drizzle-orm'
import type { DbContext } from '@/infra/database'
import { locationsTable } from '@/db/schema'
import type { LocationDto, LocationCreateDto } from './location.contract'

export class LocationRepo {
	constructor(private readonly db: DbContext) {}

	// Find by ID
	async findById(id: number): Promise<LocationDto | null> {
		return await this.db
			.select()
			.from(locationsTable)
			.where(eq(locationsTable.id, id))
			.then((rows) => rows[0] ?? null)
	}

	// Find by IDs (batch)
	async findByIds(ids: number[]): Promise<LocationDto[]> {
		if (ids.length === 0) return []
		return await this.db.select().from(locationsTable).where(inArray(locationsTable.id, ids))
	}

	// Create
	async create(data: LocationCreateDto): Promise<LocationDto> {
		return await this.db
			.insert(locationsTable)
			.values(data)
			.returning()
			.then((rows) => rows[0])
	}

	// Update
	async update(id: number, data: Partial<LocationDto>): Promise<LocationDto> {
		return await this.db
			.update(locationsTable)
			.set(data)
			.where(eq(locationsTable.id, id))
			.returning()
			.then((rows) => rows[0])
	}

	// Delete
	async delete(id: number): Promise<void> {
		await this.db.delete(locationsTable).where(eq(locationsTable.id, id))
	}
}
```

**Rules:**

- Use batch operations (`inArray`) instead of loops
- Return `null` for not found (NOT throw)
- Use `.then(rows => rows[0])` for single-row queries
- Guard empty arrays (`if (ids.length === 0) return []`)

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
import { NotFoundError, ConflictError } from '@/shared/errors/http-error'
import { RelationMap } from '@/shared/utils'
import type { ActorId } from '@/types/utils'
import type { LocationRepo } from './location.repo'
import type { LocationDto, LocationCreateDto, LocationUpdateDto } from './location.contract'

const uniqueFields: ConflictField<{ name: string; code: string }>[] = [
	{
		field: 'name',
		column: locationsTable.name,
		message: 'Location name already exists',
		code: 'LOCATION_NAME_ALREADY_EXISTS',
	},
	{
		field: 'code',
		column: locationsTable.code,
		message: 'Location code already exists',
		code: 'LOCATION_CODE_ALREADY_EXISTS',
	},
]

export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: LocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	// Public method: Create
	@record('location.create')
	async handleCreate(dto: LocationCreateDto, actor: ActorId): Promise<LocationDto> {
		// 1. Check conflicts
		await checkConflict(this.repo.db, uniqueFields, dto)

		// 2. Create
		const location = await this.repo.create({
			...dto,
			...stampCreate(actor),
		})

		// 3. Invalidate cache
		await this.cache.deleteAll()

		return location
	}

	// Public method: Update
	@record('location.update')
	async handleUpdate(dto: LocationUpdateDto, actor: ActorId): Promise<LocationDto> {
		// 1. Check exists
		const existing = await this.repo.findById(dto.id)
		if (!existing) {
			throw new NotFoundError('Location not found', {
				code: 'LOCATION_NOT_FOUND',
				context: { id: dto.id },
			})
		}

		// 2. Check conflicts
		await checkConflict(this.repo.db, uniqueFields, dto, dto.id)

		// 3. Update
		const updated = await this.repo.update(dto.id, {
			...dto,
			...stampUpdate(actor),
		})

		// 4. Invalidate cache
		await this.cache.delete(dto.id)
		await this.cache.deleteAll()

		return updated
	}

	// Public method: Get by ID
	@record('location.getById')
	async handleGetById(id: number): Promise<LocationDto> {
		return await this.cache.getOrSet(id, async () => {
			const location = await this.repo.findById(id)
			if (!location) {
				throw new NotFoundError('Location not found', {
					code: 'LOCATION_NOT_FOUND',
					context: { id },
				})
			}
			return location
		})
	}

	// Public method: Get by IDs (batch)
	@record('location.getByIds')
	async handleGetByIds(ids: number[]): Promise<LocationDto[]> {
		if (ids.length === 0) return []
		return await this.repo.findByIds(ids)
	}

	// Helper: Convert to RelationMap (for JOIN simulation)
	toRelationMap(items: LocationDto[]): RelationMap<number, LocationDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}
}
```

**Rules:**

- Public methods: `handleX` (e.g., `handleCreate`, `handleUpdate`)
- Private helpers: no prefix (e.g., `validateBusinessRule`)
- Always check conflicts BEFORE create/update
- Always invalidate cache AFTER mutations
- Use `@record` decorator for OTEL tracing
- Throw custom errors (NotFoundError, ConflictError, etc.)
- Include audit stamps (`stampCreate`, `stampUpdate`)

---

### **4. Module Factory** (`*.module.ts`)

DI container for the module.

```ts
// location.module.ts
import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'
import { LocationRepo } from './location.repo'
import { LocationService } from './location.service'

export interface LocationModule {
	location: LocationService
}

export function createLocationModule(db: DbContext, cacheClient: CacheClient): LocationModule {
	const repo = new LocationRepo(db)
	const service = new LocationService(repo, cacheClient)

	return { location: service }
}
```

**For complex modules with dependencies:**

```ts
// iam.module.ts
interface Deps {
	location: LocationModule
}

export interface IamModule {
	user: UserService
	role: RoleService
	assignment: UserAssignmentService
	composed: IamComposedService
}

export function createIamModule(db: DbContext, cacheClient: CacheClient, deps: Deps): IamModule {
	// Create repos
	const userRepo = new UserRepo(db)
	const roleRepo = new RoleRepo(db)
	const assignmentRepo = new UserAssignmentRepo(db)
	const composedRepo = new IamComposedRepo(db)

	// Create services (inject dependencies)
	const role = new RoleService(roleRepo, cacheClient)
	const assignment = new UserAssignmentService(assignmentRepo, cacheClient)
	const user = new UserService({ location: deps.location, assignment, role }, userRepo, cacheClient)
	const composed = new IamComposedService(
		{ role, assignment, user, location: deps.location },
		composedRepo,
	)

	return { user, role, assignment, composed }
}
```

---

### **5. Routes** (`*.route.ts`)

HTTP layer (Elysia).

```ts
// location.route.ts
import { Elysia, t } from 'elysia'
import type { Modules } from '@/modules/_registry'
import { LocationCreateDto, LocationUpdateDto } from './location.contract'

export const locationRoutes = (app: Elysia, modules: Modules) =>
	app.group('/locations', (app) =>
		app
			// List
			.get('/', async ({ query }) => {
				return await modules.location.handleList(query)
			})

			// Detail
			.get('/:id', async ({ params }) => {
				return await modules.location.handleGetById(params.id)
			})

			// Create
			.post(
				'/',
				async ({ body, user }) => {
					return await modules.location.handleCreate(body, user.id)
				},
				{ body: LocationCreateDto },
			)

			// Update
			.patch(
				'/:id',
				async ({ params, body, user }) => {
					return await modules.location.handleUpdate({ ...body, id: params.id }, user.id)
				},
				{ body: t.Omit(LocationUpdateDto, ['id']) },
			)

			// Delete
			.delete('/:id', async ({ params, user }) => {
				return await modules.location.handleDelete(params.id, user.id)
			}),
	)
```

**Rules:**

- Routes are THIN (just call service methods)
- Validate body with Zod schema (`{ body: XxxDto }`)
- Extract actor from context (`user.id` from JWT)
- Use inline async functions (not separate handler files)

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

### **Unit Tests** (`*.test.ts`)

Test service logic in isolation (mock repo).

```ts
// location.service.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { mock } from 'bun:test'

describe('LocationService', () => {
	let service: LocationService
	let mockRepo: LocationRepo

	beforeEach(() => {
		mockRepo = {
			findById: mock(() => Promise.resolve(null)),
			create: mock((data) => Promise.resolve({ id: 1, ...data })),
		}
		service = new LocationService(mockRepo, mockCache)
	})

	it('should create location', async () => {
		const result = await service.handleCreate(
			{
				name: 'Test',
				code: 'TEST',
				type: 'WAREHOUSE',
			},
			1,
		)

		expect(result).toMatchObject({
			name: 'Test',
			code: 'TEST',
		})
	})
})
```

### **Integration Tests** (`*.integration.test.ts`)

Test full HTTP flow (real DB + routes).

```ts
// location.integration.test.ts
import { describe, it, expect } from 'bun:test'
import { testClient } from '@/tests/helpers/test-client'

describe('POST /locations', () => {
	it('should create location', async () => {
		const response = await testClient.locations.post({
			name: 'Test Warehouse',
			code: 'TW001',
			type: 'WAREHOUSE',
		})

		expect(response.status).toBe(201)
		expect(response.data).toMatchObject({
			name: 'Test Warehouse',
			code: 'TW001',
		})
	})
})
```

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
- [ ] All repos return `null` (not throw) for not found
- [ ] All routes are thin (just validate + call service)

---

## 🎓 Next Steps

1. Read [CODE_PATTERNS.md](./CODE_PATTERNS.md) for concrete examples
2. Read [MODULE_CHECKLIST.md](./MODULE_CHECKLIST.md) for step-by-step guide
3. Read the reference modules (`location/`, `iam/`) and [MODULE_STANDARD.md](./MODULE_STANDARD.md)

---

**Questions?** Check existing modules (`iam/`, `location/`) as reference implementations.
