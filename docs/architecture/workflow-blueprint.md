# Application Workflow Blueprint: Ikki ERP

Based on the `project-workflow-analysis-blueprint-generator` standards and the established "Golden Path 2.1" architecture, this document outlines the standard end-to-end data flow and implementation templates for the Ikki ERP ecosystem.

## 1. High-Level Architecture Overview

- **Project Type**: Fullstack TypeScript (Monorepo)
- **Frontend**: React + TanStack Router/Query + Shadcn + Tailwind V4
- **Backend (API)**: ElysiaJS (Type-safe runtime)
- **Persistence**: PostgreSQL (Neon Database) via Drizzle ORM
- **Architecture Pattern**: Modular/Layered Architecture (Routes -> Services -> Repositories -> Database)

---

## 2. Standard Workflow: Query Data (e.g., Fetching Inventory)

### Trigger

A user navigates to the `/inventory` frontend route.

### Frontend Flow (React + TanStack Query)

1. **Component**: `InventoryList.tsx` renders.
2. **Hook**: Calls `useQuery({ queryKey: ['inventory'], queryFn: api.inventory.list })`.
3. **Transport**: `ky` (or native fetch wrapper) sends an HTTP GET request to `/api/inventory?page=1&limit=10`.
4. **State**: TanStack Query manages `isLoading`, `isError`, and `data` states.

### Backend Flow (ElysiaJS + Drizzle)

1. **Entry Point (Router)**: `apps/server/src/modules/inventory/router/inventory.route.ts`
   - Intercepts `GET /`.
   - Validates incoming query parameters using `Zod` (e.g., `zQuerySearch`).
2. **Service Layer**: `apps/server/src/modules/inventory/service/inventory.service.ts`
   - Receives validated parameters.
   - Applies business logic (e.g., checking user permissions for specific warehouses).
3. **Data Access (Drizzle)**:
   - Constructs a type-safe SQL query using `db.select().from(inventoryTable).where(...)`.
   - Fetches paginated results directly from Neon Postgres.
4. **Response**:
   - Service formats the data into a standard response DTO (`{ data: [...], meta: { page: 1, ... } }`).
   - Elysia serializes and returns JSON to the client.

---

## 3. Standard Workflow: Mutate Data (e.g., Create Purchase Order)

### Trigger

A user submits a form in the `/purchasing` module.

### Frontend Flow (React + TanStack Form/Query)

1. **Component**: `CreatePoForm.tsx` handles input via `@tanstack/react-form`.
2. **Validation**: Form validates input using shared `Zod` schemas from the backend `dto` folder.
3. **Mutation**: `useMutation({ mutationFn: api.purchasing.createPo })` is triggered on submit.
4. **Transport**: HTTP POST request sent to `/api/purchasing/orders` with JSON payload.

### Backend Flow (ElysiaJS + Drizzle)

1. **Entry Point (Router)**: `purchasing.route.ts`
   - Intercepts `POST /orders`.
   - Validates `body` against `createPoDto` (Zod).
2. **Service Layer**: `purchasing.service.ts`
   - Begins a database transaction if multiple entities are involved (e.g., PO Header + PO Details).
3. **Data Access**:
   - `db.insert(poHeaderTable).values(...)`
   - `db.insert(poLineItemTable).values(...)`
4. **Commit/Rollback**: Transaction completes.
5. **Response**: Returns the newly created ID, mapped to a response schema.
6. **Frontend Resolution**: TanStack Query triggers `queryClient.invalidateQueries(['purchasing'])` to auto-refresh tables.

---

## 4. Implementation Guidelines

### Naming Conventions

- **Routing**: `[entity].route.ts`
- **Service**: `[entity].service.ts`
- **Schema**: `[entity].schema.ts` (Drizzle tables)
- **DTO**: `[entity].dto.ts` (Zod schemas for cross-boundary types)

### Error Handling

- Use global error handlers in Elysia to catch `DatabaseError` or `ValidationError`.
- Format responses consistently: `{ error: { code: 'INVALID_INPUT', message: '...' } }`.
- Frontend maps these via global TanStack Query error boundaries or `sonner` toasts.

### Reusability

- Extract common validations (like pagination, IDs) into an `apps/server/src/utils/validation` file.
- Strict mapping between Zod schemas and Drizzle `createInsertSchema` to maintain a single source of truth for types.
