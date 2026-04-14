# AI Context: Developer & Agent Bootstrap

This document is specifically designed to bootstrap AI coding assistants (like Gemini, Claude, or Copilot) into the Ikki ERP codebase. It summarizes the non-negotiable architectural standards and patterns.

## 🏛️ Core Principles

### 1. Integer ID Strategy (Storage Efficiency)

- **Standard**: All Primary Keys (PK) and Foreign Keys (FK) must use **Serial Integers** (PostgreSQL `serial` / `integer`).
- **Exception**: UUIDs are reserved ONLY for high-growth external logs or sync-heavy entities.
- **Zod Primitive**: Always use `zId` from `@/core/validation/primitive`.

### 2. The Golden Path 2.1 (Backend)

- **Layering**: Layer 0 (Service) → Layer 1 (Router). No circular dependencies.
- **DTO Suffix**: ALL Zod schemas/types in `dto/` MUST append the `Dto` suffix (e.g., `LocationDto`).
- **Functional Routers**: Prefer inline `async function` handlers over `Handler` classes to leverage Elysia's type system accurately.
- **Metadata**: Every transactional record MUST include the metadata spread (`createdBy`, `updatedBy`, `createdAt`, `updatedAt`, `syncAt`).

### 3. Spread-Shape Composition

- **Zod Patterns**: Avoid `.extend()` for primary DTO composition. Use the Spread-Shape pattern to preserve clean TypeScript inference.
  ```typescript
  export const MyDto = z.object({ ...BaseDto.shape, ...zId.shape })
  ```

---

## 🚦 Strategic Routing Pattern

Every module's `init[Module]Route` should follow this functional structure:

```typescript
export function initLocationRoute(service: LocationService) {
	return new Elysia({ prefix: '/location' }).use(authPluginMacro).get(
		'/list',
		async function list({ query }) {
			const result = await service.handleList(query)
			return res.paginated(result)
		},
		{ query: LocationFilterDto, response: createPaginatedResponseSchema(LocationDto), auth: true },
	)
}
```

## 🛠️ Global Utilities (`@/core`)

- **Database**: `pk`, `metadata`, `stamps`, `paginate`, `takeFirstOrThrow`, `checkConflict`.
- **Validation**: `zId`, `zCodeUpper`, `zEmail`, `zPaginationDto`.
- **Response**: `res.ok`, `res.paginated`, `res.created`.

---

## 📋 Template Library (AI Knowledge Base)

To ensure zero syntax errors and 100% standard compliance, always refer to the perfect-state templates in `docs/templates/`:

- **[DTO Template](./templates/module.dto.ts.txt)**: Spread-shape pattern and suffix rules.
- **[Service Template](./templates/module.service.ts.txt)**: OpenTelemetry, auditing, and conflict logic.
- **[Router Template](./templates/module.route.ts.txt)**: Functional routes and REST standards.

---

> [!TIP]
> **To the AI Agent**: Always prioritize consistency with the reference implementations in `src/modules/location/` and `src/modules/iam/`. If a pattern conflicts with a legacy module, prioritize the **Golden Path 2.1** standards described here.
