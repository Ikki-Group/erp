# Backend Standard: Project Structure

This document defines the standards for project organization and module layout within the Ikki ERP backend.

## 1. Module-Based Organization

All business features must be organized by **Domain Modules** within `src/modules/`. Avoid generic top-level folders like `controllers` or `models`.

```text
src/
├── modules/
│   ├── location/      # Location Domain
│   │   ├── dto/       # Zod schemas & types
│   │   ├── service/   # Layer 0: Logic & Data
│   │   └── router/    # Layer 1: Elysia Routes
│   ├── iam/           # Identity & Access Management
│   │   ├── dto/
│   │   ├── service/
│   │   └── router/
├── core/              # Shared infrastructure
│   ├── database/      # Drizzle, migrations, helpers
│   ├── http/          # Errors, response factories, macros
│   └── validation/    # Primitive Zod schemas
└── db/                # Global database instance & schema
```

## 2. Layered Architecture

Ikki ERP follows a strict two-layer architecture within each module:

- **Layer 0 (Service)**: Pure business logic, database orchestration, and caching. No dependency on Elysia or HTTP-specific objects (other than context).
- **Layer 1 (Router)**: HTTP request handling, input validation, and response formatting using Elysia. Depends on Service.

## 3. Core Utilities

Avoid reimplementing common patterns. Always check and use `@/core`:

- **`@/core/database`**: Use `pk`, `auditColumns`, `stamps`, `paginate`, and `checkConflict`.
- **`@/core/http`**: Use `res.ok`, `res.paginated`, and standard error classes like `NotFoundError`.
- **`@/core/validation`**: Use `zId`, `zStr`, `zDate`, and standard response schemas.

## 4. Environment Variables

All environment variables must be defined and validated in a central configuration or at the entry point. Avoid using `Bun.env` directly in domain modules; use a wrapper or injected config if possible.

## 5. Coding Style

- **No `any`**: Perfect type safety is non-negotiable in domain modules.
- **No `@ts-ignore`**: Fix the type issues at the root.
- **Named Exports**: Prefer named exports over `default` exports for better discoverability and refactoring support.
- **JSDoc**: Use JSDoc for complex logic or enum members, but favor clean, self-documenting TypeScript code.

---

> [!IMPORTANT]
> The **Location** and **IAM** modules in `src/modules/` are the definitive reference implementations for this structure.
