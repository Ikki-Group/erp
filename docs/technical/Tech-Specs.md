# Technical Specifications — Ikki ERP

> **Version**: 1.0 | **Updated**: 2026-04-26

---

## System Architecture

**Monorepo** orchestrated by Bun Workspaces.

### Workspace Modules

- `apps/web`: Frontend (Vite, React 19, TypeScript)
- `apps/server`: Backend (Bun, ElysiaJS, Drizzle, PostgreSQL)
- `packages/*`: Reserved for shared packages (not implemented)

### Dependency Management

Root `package.json` defines Bun Catalog for shared versions:

```jsonc
"catalog": {
  "oxfmt": "^0.42.0",
  "oxlint": "^1.57.0",
  "typescript": "^6.0.2",
  "zod": "^4.3.6"
}
```

Use `"dependency": "catalog:"` syntax to prevent version drift.

---

## Frontend (`apps/web`)

### Core Stack

- **Framework**: React 19 + Vite
- **Routing**: `@tanstack/react-router` (file-based, type-safe)
- **State**: `@tanstack/react-query` v5 (remote), `zustand` v5 (local)
- **Forms**: `@tanstack/react-form` + `@tanstack/zod-form-adapter`
- **API Client**: `ky` with bearer token injection
- **Observability**: `@sentry/react`

### Styling

- **CSS**: Tailwind CSS v4.2 via `@tailwindcss/vite`
- **UI Primitives**: `@base-ui/react`, `radix-ui`, `shadcn/ui`
- **Icons**: `@hugeicons/react`, `lucide-react`
- **Charts**: `recharts`

### Structure

```
src/
├── app.tsx, main.tsx
├── config/ (endpoints, menu)
├── components/ (ui, data-table, form, layout, patterns, reui)
├── features/ (auth, dashboard, iam, inventory, location, material, product, recipe)
├── hooks/
├── lib/ (api, zod, sentry, tanstack-query, router, formatters)
├── routes/ (TanStack file-based)
├── styles/
└── types/
```

### Tooling

- **Lint/Format**: `Oxlint`, `Oxfmt`
- **Type Check**: `tsc --noEmit`
- **Testing**: `vitest` + `@testing-library/react`

---

## Backend (`apps/server`)

> **Full standards**: [ARCHITECTURE.md](./ARCHITECTURE.md) | [SERVER_STANDARDS.md](./SERVER_STANDARDS.md)

### Stack

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Cache**: Upstash Redis (via cache-manager)
- **Deployment**: Fly.io

### Observability

- **Tracing**: OpenTelemetry (`@elysiajs/opentelemetry`, `@kubiks/otel-drizzle`)
- **Logging**: Pino → AxiomHQ (`@axiomhq/pino`)

### Dependency Layers

- **Layer 0**: location, product (no deps)
- **Layer 1**: iam, material (depends on Layer 0)
- **Layer 1.5**: auth (depends on iam)
- **Layer 2**: inventory, recipe, sales (depends on Layer 0-1)
- **Layer 3**: dashboard, tool, moka (depends on all)

Validate: `bun run check-deps`

---

## Development Workflow

- **Binary**: Use `bun` exclusively (`bun run dev`, `bun add`)
- **Verify**: `bun run verify` (lint + typecheck + knip + check-deps)
- **Pre-commit**: husky + lint-staged (oxlint --fix, oxfmt -w)

### Commands

| Command | Scope | Purpose |
|---------|-------|---------|
| `bun run dev:server` | Root | Start server with watch |
| `bun run dev:web` | Root | Start frontend (port 3000) |
| `bun run lint` | Root | Oxlint workspace |
| `bun run format` | Root | Oxfmt workspace |
| `bun run check` | Root | Lint + format check |
| `bun run verify` | Server | Full verification |
| `bun run db:generate` | Server | Generate migrations |
| `bun run db:migrate` | Server | Apply migrations |
| `bun run db:studio` | Server | Drizzle Studio GUI |
