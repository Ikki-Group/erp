# Technical Specifications: Ikki ERP

> **Version**: 1.1  
> **Last Updated**: 2026-03-26  
> **Changelog**:
>
> - `v1.1` (2026-03-26) — Corrected workspace docs, removed Eden Treaty reference, fixed naming conventions, added Bun Catalog guidance, updated dependency versions
> - `v1.0` (Initial) — Original technical specification

This document outlines the software architecture, dependency rules, and infrastructure constraints governing the development of the Ikki ERP application.

## 1. System Architecture Overview

The Ikki ERP is structured as a type-safe **Monorepo Architecture** orchestrated by **Bun Workspaces**. This configuration is established to enforce code sharing and minimize module duplication between the frontend and backend layers.

### 1.1 Workspace Modules

- `apps/web`: The primary frontend application (Vite, React 19, TypeScript).
- `apps/server`: The primary backend application (Bun, ElysiaJS, Drizzle ORM, PostgreSQL).
- `packages/*`: Reserved workspace for future shared packages (e.g., shared Zod schemas, OpenAPI definitions). Not yet implemented.

### 1.2 Dependency Version Management

The root `package.json` defines a **Bun Catalog** for shared dependency versions:

```jsonc
// Root package.json — catalog section
"catalog": {
  "oxfmt": "^0.42.0",
  "oxlint": "^1.57.0",
  "oxlint-tsgolint": "^0.17.3",
  "typescript": "^6.0.2",
  "zod": "^4.3.6"
}
```

> **Convention**: All app `package.json` files should reference catalog versions using `"dependency": "catalog:"` syntax to prevent version drift across workspaces.

---

## 2. Frontend Architecture (`apps/web`)

### 2.1 Core Frameworks

- **Framework Base**: React 19 running via the Vite bundler.
- **Routing Engine**: `@tanstack/react-router` with the `@tanstack/router-plugin` for **file-based routing** and inherently type-safe search parameters.
- **Application State Management**:
  - Remote Data / Caching: `@tanstack/react-query` v5.
  - Local UI Variables: `zustand` v5.
- **Form Management**: `@tanstack/react-form` integrated with `@tanstack/zod-form-adapter` for stateless, highly performant form inputs.
- **API Client**: `ky` — a lightweight HTTP client with bearer token injection via Zustand state. Endpoints are centralized in `src/config/endpoint.ts`.
- **Observability**: `@sentry/react` implemented globally for active production error reporting and performance tracking.

### 2.2 Component & Styling Architecture

- **CSS Preprocessor**: Tailwind CSS v4.2 orchestrated through `@tailwindcss/vite`.
- **UI Primitives**: Leveraging `@base-ui/react`, `radix-ui`, and `shadcn/ui` to establish an accessible, highly customizable design system.
- **Component Layers**:
  - `components/ui/` — Base primitives from Shadcn/Radix registry
  - `components/data-table/` — Reusable DataTable components (TanStack Table)
  - `components/form/` — Shared form field components
  - `components/layout/` — Application shell, sidebar, navigation
  - `components/patterns/` — Composed UI patterns (dialogs, confirmations)
  - `components/reui/` — Custom design system extensions
- **Iconography**: Standardized via `@hugeicons/react` and `lucide-react`.
- **Data Visualization**: `recharts` implemented for internal management dashboards.

### 2.3 Frontend Structure

```text
src/
├── app.tsx                    # Root application with providers
├── main.tsx                   # Entry point
├── config/                    # App config, API endpoints, menu definitions
├── components/                # Reusable UI components (by category)
├── features/                  # Domain-specific logic per module
│   ├── auth/
│   ├── dashboard/
│   ├── iam/
│   ├── inventory/
│   ├── location/
│   ├── material/
│   ├── product/
│   └── recipe/
├── hooks/                     # Shared custom hooks
├── lib/                       # Utilities, API client, integrations
│   ├── api/                   # ky-based API client + factory
│   ├── zod/                   # Shared Zod utilities
│   └── *.ts                   # sentry, tanstack-query, router, formatters
├── routes/                    # TanStack file-based routes
│   ├── __root.tsx
│   ├── _app/                  # Authenticated layout routes
│   └── _auth/                 # Public auth routes
├── styles/                    # Global CSS
└── types/                     # Shared TypeScript types
```

### 2.4 Quality Assurance Tooling

- **Linting and Formatting**: The repository adopts high-performance compilation tools, exclusively utilizing `Oxlint` and `Oxfmt` over legacy ESLint setups.
- **Compilation Check**: Strict type-safety boundaries are enforced locally and in CI/CD environments via `tsc --noEmit`.
- **Unit Testing**: `vitest` with `@testing-library/react` for component testing.

---

## 3. Backend Architecture (`apps/server`)

The backend engine enforces a highly disciplined **Service-Controller** tiered architecture via **ElysiaJS**.

### 3.1 Infrastructure Integrations

- **Relational Database**: PostgreSQL deployment managed securely via **Neon Serverless** (`@neondatabase/serverless`) for immediate horizontal scalability.
- **ORM Interface**: Drizzle ORM (`drizzle-orm`).
- **Caching Layer**: **Upstash Redis** (`@upstash/redis`) integrated via the `cache-manager` library. This is critical for preventing database saturation during heavy analytical queries.
- **Deployment Strategy**: Configured primarily for isolated container orchestration via **Fly.io** (`flyctl deploy`).

### 3.2 Observability & Telemetry

- **Distributed Tracing**: Native OpenTelemetry is active across the framework layer (`@elysiajs/opentelemetry`) and the ORM layer (`@kubiks/otel-drizzle`).
- **Structured Logging**: Executed via the `pino` library. Logs transit automatically to AxiomHQ integrations (`@axiomhq/pino`).

### 3.3 Domain Dependency Rules

To completely eliminate architectural gridlocks (circular dependencies), all internal modules are subject to strict import directions. A module operating in a lower layer **must never** import dependencies from a higher layer. This is validated systematically utilizing `dpdm` (`bun run check-deps`).

- **Layer 0 (Core System)**: `location`, `product`. (Must have zero dependencies).
- **Layer 1 (Master Data)**: `iam`, `materials`. (Restricted to depending upon Layer 0).
- **Layer 1.5 (Security)**: `auth`. (Restricted to depending upon Layer 1).
- **Layer 2 (Operations)**: `inventory`, `recipe`, `sales`. (Restricted to depending upon Layer 0 and Layer 1).
- **Layer 3 (Aggregators)**: `dashboard`, `tool`, `moka`. (Permitted to depend freely upon any foundational layer).

> **Note**: The `moka` module is an external POS integration engine classified as a Layer 3 Aggregator.

### 3.4 Strict Module Scaffolding

Every designated domain application inside `server/src/modules/` must follow the prescribed hierarchical blueprint:

```text
modules/<domain>/
├── dto/                    # API contractual layers / Zod schema mapping
│   ├── index.ts
│   └── <entity>.dto.ts
├── router/                 # Dedicated Elysia route handlers (Thin Controllers)
│   ├── index.ts
│   └── <entity>.route.ts
├── service/                # Protected Business Logic & isolated Database executions
│   ├── index.ts            # ServiceModule (Dependency Injection Class)
│   └── <entity>.service.ts
└── index.ts                # Master Module Barrel Export
```

### 3.5 Module Registry & Dependency Injection

All modules are instantiated and wired in `src/modules/_registry.ts` using **constructor-based dependency injection**. The registry enforces layer ordering:

```typescript
// Layer 0 — Core (zero dependencies)
const location = new LocationServiceModule()
const product = new ProductServiceModule()

// Layer 1 — Masters (depends on Layer 0)
const iam = new IamServiceModule(location)
const material = new MaterialServiceModule(location)

// Layer 1.5 — Auth (depends on Layer 1)
const auth = new AuthServiceModule(iam)

// Layer 2 — Operations (depends on Layer 0/1)
const inventory = new InventoryServiceModule(material)
const recipe = new RecipeServiceModule()
const sales = new SalesServiceModule()

// Layer 3 — Aggregators (depends on any layer)
const dashboard = new DashboardServiceModule(iam, location)
const tool = new ToolServiceModule(iam, location, product, material)
const moka = new MokaServiceModule(logger)
```

### 3.6 Database Authority Governance

- **Write Operations**: All database mutators (`INSERT`, `UPDATE`, `DELETE`) directed at a specific domain table are strictly forbidden outside of its dedicated Domain Service.
- **Read Operations**: Multi-domain read-only operations via `JOIN` clauses are authorized to maintain strict query performance goals.

### 3.7 Data Transfer Objects (DTO) Standardization

Data validity requires robust mapping across the system boundaries. As such, five absolute schemas must exist for every business entity:

1. `EntityDto`: Full representation of database tables.
2. `EntityFilterDto`: Permitted query structures for LIST routes (pagination, limits, fuzzy searching).
3. `EntityOutputDto`: Sanitized and verified payload format for public clients.
4. `EntityCreateDto`: Creation mapping template.
5. `EntityUpdateDto`: Modification mapping template.

---

## 4. Development Workflow Operations

- **Binary Runner**: Active development must default exclusively to `bun` invocations (e.g., `bun run dev`, `bun add`).
- **Codebase Verification**: Execution of `bun run verify` in the server application context initiates parallel linting, type-checking, Unused-Code analysis (`Knip`), and strict circular dependency validation (`dpdm`).
- **Pre-commit Hooks**: `husky` + `lint-staged` enforce `oxlint --fix` and `oxfmt -w` on staged TypeScript files before each commit.

### 4.1 Key Development Commands

| Command | Scope | Purpose |
|---------|-------|---------|
| `bun run dev:server` | Root | Start server with watch mode |
| `bun run dev:web` | Root | Start frontend dev server on port 3000 |
| `bun run lint` | Root | Run Oxlint across entire workspace |
| `bun run format` | Root | Run Oxfmt across entire workspace |
| `bun run check` | Root | Lint + format check |
| `bun run verify` | Server | Full verification: lint + typecheck + knip + check-deps |
| `bun run db:generate` | Server | Generate Drizzle migrations |
| `bun run db:migrate` | Server | Apply Drizzle migrations |
| `bun run db:studio` | Server | Open Drizzle Studio GUI |
