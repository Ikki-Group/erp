# Server Documentation

Index for the Ikki ERP server (`apps/server`) — Elysia + Drizzle API on Bun.

## Start here

| I need to...                                            | Read                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| Understand the system design & layering                 | [01-server-architecture.md](./01-server-architecture.md)           |
| Know the rules for how a module is structured           | [02-module-standard.md](./02-module-standard.md) — source of truth |
| Know naming, imports, TS style, HTTP & deletion rules   | [03-code-standard.md](./03-code-standard.md)                       |
| Copy a concrete pattern (repo, service, cache, tx, Zod) | [04-code-patterns.md](./04-code-patterns.md)                       |
| Build a new module step by step                         | [05-module-checklist.md](./05-module-checklist.md)                 |
| Understand the database schema                          | [../database/readme.md](../database/readme.md)                     |

## Quick facts

- **Runtime**: Bun · **Framework**: Elysia · **ORM**: Drizzle
- **Validation**: Zod via shared primitives `zp` (output), `zc` (input), `zq` (query, coerced)
- **Layout**: vertical-slice modules under `src/modules/{name}/`
- **Two shapes**: simple (flat files, e.g. `location/`) and complex (per-entity folders + `composed/`, e.g. `iam/`)
- **Layering**: modules import downward only (aggregators → operations → master data → core)
- **Repo contract**: reads return `T | undefined`; writes return `EntityRef | undefined`; every write takes `db?` for transactions
- **Service contract**: `handleX` = the only route entrypoints; typed errors; audit stamps + cache invalidation on every mutation
- **Routes**: thin `new Elysia({ prefix })` + `authPluginMacro`; validate → one `handleX` → wrap in `res.*`

## Documents

| #   | File                                                     | Purpose                                                               |
| --- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| 01  | [01-server-architecture.md](./01-server-architecture.md) | Project structure, layers, data flow, module anatomy.                 |
| 02  | [02-module-standard.md](./02-module-standard.md)         | Source of truth. Non-negotiable module rules.                         |
| 03  | [03-code-standard.md](./03-code-standard.md)             | Naming, imports, TypeScript style, HTTP conventions, deletion, audit. |
| 04  | [04-code-patterns.md](./04-code-patterns.md)             | Copy-ready snippets: Zod, repo, service, conflict, tx, cache, errors. |
| 05  | [05-module-checklist.md](./05-module-checklist.md)       | Step-by-step build checklist aligned to the standard.                 |

## Commands (run from `apps/server`)

```bash
bun run verify        # lint + typecheck + knip + check-deps (the real gate)
bun run typecheck     # tsc --noEmit
bun run lint          # oxlint --type-aware
bun run check-deps    # circular dependency check
bun run test          # NODE_ENV=test bun test --bail
bun run db:generate   # generate migrations from schema changes
bun run db:migrate    # apply migrations
```

## Principles

1. **Single source of truth.** `02-module-standard.md` wins for module rules. Don't re-document the same rule in multiple places.
2. **Keep it current.** Fix docs when the code changes rather than letting them drift.
3. **AI-friendly.** Structured Markdown — clear headers, bullets, tables.

---

**Next:** [01-server-architecture.md](./01-server-architecture.md) — System design and layering.
