# Technical Specifications: Ikki ERP

This document outlines the software architecture, dependency rules, and infrastructure constraints governing the development of the Ikki ERP application.

## 1. System Architecture Overview

The Ikki ERP is structured as a type-safe **Monorepo Architecture** orchestrated by **Bun Workspaces**. This configuration is established to enforce code sharing and minimize module duplication between the frontend and backend layers.

### 1.1 Workspace Modules
- `apps/web`: The primary frontend application (Vite, React 19, TypeScript).
- `apps/server`: The primary backend application (Bun, ElysiaJS, Drizzle ORM, PostgreSQL).
- `packages/api`: An isolated dependency module containing OpenAPI standard definitions and shared Zod schemas. This methodology strictly avoids heavy IDE extensions (e.g., Eden Treaty) to ensure optimal TypeScript Language Server Performance (LSP).

---

## 2. Frontend Architecture (`apps/web`)

### 2.1 Core Frameworks
- **Framework Base**: React 19 running via the Vite bundler.
- **Routing Engine**: `Tanstack React Router` implementing strict file-based routing and inherently type-safe search parameters.
- **Application State Management**:
  - Remote Data / Caching: `Tanstack Query v5`.
  - Local UI Variables: `Zustand` v5.
- **Form Management**: `Tanstack Form` integrated closely with Zod validation adapters to ensure stateless, highly performant inputs.
- **API Client**: A standard, lightweight HTTP client (e.g., Ky or Axios) mapped exclusively against the shared OpenAPI Zod schemas.
- **Observability**: `@sentry/react` implemented globally for active production error reporting and performance tracking.

### 2.2 Component & Styling Architecture
- **CSS Preprocessor**: Tailwind CSS v4.2 orchestrated through `@tailwindcss/vite`.
- **UI Primitives**: Leveraging `@base-ui/react` and `shadcn/ui` to establish an accessible, highly customizable design system.
- **Iconography**: Standardized via `Hugeicons` and `Lucide`.
- **Data Visualization**: `recharts` implemented for internal management dashboards.

### 2.3 Quality Assurance Tooling
- **Linting and Formatting**: The repository adopts high-performance compilation tools, exclusively utilizing `Oxlint` and `Oxfmt` over legacy ESLint setups.
- **Compilation Check**: Strict type-safety boundaries are enforced locally and in CI/CD environments via `tsc --noEmit`.

---

## 3. Backend Architecture (`apps/server`)

The backend engine enforces a highly disciplined **Service-Controller** tiered architecture via **ElysiaJS**.

### 3.1 Infrastructure Integrations
- **Relational Database**: PostgreSQL deployment managed securely via **Neon Serverless** for immediate horizontal scalability.
- **ORM Interface**: Drizzle ORM Beta.
- **Caching Layer**: **Upstash Redis** integrated via the `cache-manager` library. This is critical for preventing database saturation during heavy analytical queries.
- **Deployment Strategy**: Configured primarily for isolated container orchestration via **Fly.io** (`flyctl deploy`).

### 3.2 Observability & Telemetry
- **Distributed Tracing**: Native OpenTelemetry is active across the framework layer (`@elysiajs/opentelemetry`) and the ORM layer (`@kubiks/otel-drizzle`).
- **Structured Logging**: Executed via the `pino` library. Logs transit automatically to AxiomHQ integrations (`@axiomhq/pino`).

### 3.3 Domain Dependency Rules
To completely eliminate architectural gridlocks (circular dependencies), all internal modules are subject to strict import directions. A module operating in a lower layer **must never** import dependencies from a higher layer. This is validated systematically utilizing `dpdm` (`bun run check-deps`).
- **Layer 0 (Core System)**: `locations`, `products`. (Must have zero dependencies).
- **Layer 1 (Master Data)**: `iam`, `materials`. (Restricted to depending upon Layer 0).
- **Layer 1.5 (Security)**: `auth`. (Restricted to depending upon Layer 1).
- **Layer 2 (Operations)**: `inventory`, `recipes`, `purchasing`, `sales`. (Restricted to depending upon Layer 0 and Layer 1).
- **Layer 3 (Aggregators)**: `dashboard`, `tools`. (Permitted to depend freely upon any foundational layer).

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

### 3.5 Database Authority Governance
- **Write Operations**: All database mutators (`INSERT`, `UPDATE`, `DELETE`) directed at a specific domain table are strictly forbidden outside of its dedicated Domain Service.
- **Read Operations**: Multi-domain read-only operations via `JOIN` clauses are authorized to maintain strict query performance goals.

### 3.6 Data Transfer Objects (DTO) Standardization
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
