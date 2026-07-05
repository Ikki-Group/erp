# Ikki ERP Documentation

Central documentation for Ikki ERP. Structured to be readable for the team and
ingestible as AI context. **Business/product** definitions are kept separate from
**technical/architecture** references.

> Toolchain, commands, and deploy live in [`AGENTS.md`](../AGENTS.md) (root).
> Deeper AI working instructions live in [`CLAUDE.md`](../CLAUDE.md) (root).

## Layout

### `server/` — backend server (developer + AI)

- [`README.md`](./server/README.md) — index: start here, quick facts, the four docs.
- **[`MODULE_STANDARD.md`](./server/MODULE_STANDARD.md)** — **source of truth**
  for how a module is structured (repo ports, `undefined` not-found, explicit-db
  `checkConflict`, `withTransaction`, unit-first tests). Reference modules:
  `location/` (simple), `iam/` (complex). Start here.
- [`SERVER_ARCHITECTURE.md`](./server/SERVER_ARCHITECTURE.md) — broader system
  design and layering.
- [`CODE_PATTERNS.md`](./server/CODE_PATTERNS.md) — Zod / service / repo /
  cache / transaction implementation patterns.
- [`MODULE_CHECKLIST.md`](./server/MODULE_CHECKLIST.md) — step-by-step build
  checklist, aligned to `MODULE_STANDARD.md`.

### `codegen/` — contract-driven web codegen (⚠️ superseded)

> ⚠️ The contract-driven web codegen was **cancelled**; the web DTO layer is now
> managed manually. These docs are retained for historical context only and no
> longer reflect the build — do not follow them.

- [`WEB_CODEGEN.md`](./codegen/WEB_CODEGEN.md) — (historical) how server contracts
  generated the web DTO/API layer.
- [`WEB_CODEGEN_ROLLOUT.md`](./codegen/WEB_CODEGEN_ROLLOUT.md) — (historical)
  per-feature migration plan.

### `database/` — schema reference (read before touching `db/schema/`)

- [`README.md`](./database/README.md) — index: domain map, quick facts, links.
- [`SCHEMA_CONVENTIONS.md`](./database/SCHEMA_CONVENTIONS.md) — rules for writing/
  reviewing schema changes (naming, constraints, indexing, caching).
- `ERD_*.md` — Mermaid ER diagrams, one per layer (core, master data, operations,
  integrations) + a domain overview.
- [`PAYMENT_MODULE.md`](./database/PAYMENT_MODULE.md) — payment schema design notes.

### `product/` — business & product (PM perspective)

- [`VISION.md`](./product/VISION.md) — product vision / north star.
- [`PRD.md`](./product/PRD.md) — product requirements.
- [`WORKFLOWS.md`](./product/WORKFLOWS.md) — high-level business process flows.
- `templates/` — [`FEATURE_TEMPLATE.md`](./product/templates/FEATURE_TEMPLATE.md)
  and [`FEATURE_DOCUMENTATION_STANDARD.md`](./product/templates/FEATURE_DOCUMENTATION_STANDARD.md)
  for writing new feature docs.

## Docs that live next to code (not here)

Some docs stay code-adjacent on purpose:

- `apps/server/README.md`, `apps/web/README.md`, `apps/e2e/README.md` — app quick-starts.
- `apps/web/src/components/REGISTRY.md` — UI component registry (read before building UI).
- `apps/server/src/modules/{dashboard,moka,reporting}/README.md` — module-specific notes.
- `.github/workflows/README.md` — CI secrets.

## Principles

1. **Single source of truth.** `MODULE_STANDARD.md` wins for module rules; don't
   re-document the same rule in multiple places.
2. **Keep it current.** Delete docs that describe superseded patterns rather than
   letting them drift.
3. **AI-friendly.** Structured Markdown (clear headers, bullets, tables).
4. **Business-first in `product/`.** No code/SQL there — that belongs in
   `server/` and `database/`.
