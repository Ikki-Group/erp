# Code Standard

Naming conventions, import order, TypeScript style, and HTTP rules.

## Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Module directory | `kebab-case` | `menu-item/`, `audit-log/` |
| Module files | `{module}.{layer}.ts` | `location.repo.ts`, `location.service.ts` |
| Contract files | `{module}.contract.ts` | `location.contract.ts`, `user.contract.ts` |
| Classes | `PascalCase` | `LocationService`, `LocationRepo` |
| Interfaces (ports) | `I{Module}Repo` | `ILocationRepo`, `ISupplierRepo` |
| Type aliases | `PascalCase` | `LocationDto`, `ActorId` |
| Functions | `camelCase` | `createLocationModule`, `stampCreate` |
| Variables / params | `camelCase` | `actorId`, `cacheClient` |
| Constants (module) | `camelCase` | `uniqueFields` |
| Constants (env) | `UPPER_SNAKE` | `DATABASE_URL` |
| Zod schemas | `PascalCase` + `Dto` | `LocationDto`, `LocationCreateDto` |
| Error factories | `PascalCase` object | `LocationError.notFound(id)` |
| Enums (Zod) | `PascalCase` + `Enum` | `LocationTypeEnum`, `OrderStatusEnum` |

## Contract Naming

| Pattern | Role | Example |
|---------|------|---------|
| `{Entity}Dto` | Entity / response | `LocationDto`, `OrderDto` |
| `{Entity}CreateDto` | Create input | `LocationCreateDto` |
| `{Entity}UpdateDto` | Update input | `LocationUpdateDto` |
| `{Entity}FilterDto` | List query params | `LocationFilterDto` |
| `{Entity}DetailDto` | Enriched response | `OrderDetailDto` |
| `{Entity}MutationDto` | Shared base (NOT exported) | `LocationMutationDto` |
| `{Name}Enum` | Enum values | `LocationTypeEnum` |

## Module Factories

| Purpose | Pattern | Example |
|---------|---------|---------|
| Module factory | `create{Module}Module` | `createLocationModule` |
| Route factory | `create{Module}Route` | `createLocationRoute` |

## Import Order

```ts
// 1. External packages
import { Elysia } from 'elysia'
import { z } from 'zod'

// 2. Internal absolute (@/ aliases), grouped by layer
import { locationsTable } from '@/db/schema'
import { assertFound, checkConflict } from '@/infra/database'
import { stampCreate } from '@/shared/audit/stamp'
import type { ActorId, EntityRef } from '@/shared/types/utils'

// 3. Relative (sibling module files)
import type { LocationDto, LocationFilterDto } from './location.contract'
import { LocationError } from './location.internal'
import type { ILocationRepo } from './location.repo'
```

## TypeScript Rules

- Use `import type` for type-only imports (verbatimModuleSyntax).
- Use `.ts` extensions in import paths (allowImportingTsExtensions).
- Prefer `interface` for object shapes with methods, `type` for unions/intersections.
- No `any` — use `unknown` and narrow.
- No `enum` keyword — use Zod enum (`z.enum([...])`) or `as const`.

## HTTP Rules

- All routes behind auth (except login/register).
- GET for reads, POST for creates, PUT for updates, DELETE for removes.
- Query params for filters and IDs on GET/DELETE.
- Body for data on POST/PUT.
- Response wrappers: `res.ok()`, `res.created()`, `res.paginated()`.
- Location context from session — never passed as query param.

## Comments

- JSDoc on exported module APIs and non-obvious business logic.
- Step comments in long functions (`// 1. Validate`, `// 2. Check conflicts`).
- No redundant comments that restate the type signature.

---

**Next:** [04-code-patterns.md](./04-code-patterns.md) — Copy-ready patterns.
