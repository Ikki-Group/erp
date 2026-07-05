# Server Documentation

Index for everything about the Ikki ERP **server** (Elysia + Drizzle API).
Written primarily for **AI agents** working in this repo — read this file first,
then follow the links below for the specific thing you need.

> Source of truth is always the code: `apps/server/src/**`. These docs describe
> and explain that code — if they ever disagree, the code wins and the docs need
> fixing. Reference modules: `location/` (simple), `iam/` (complex).

## Start here

| I need to...                                            | Read                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| Know the rules for how a module is structured           | **[`MODULE_STANDARD.md`](./MODULE_STANDARD.md)** — the source of truth |
| Understand the broader system design & layering         | [`SERVER_ARCHITECTURE.md`](./SERVER_ARCHITECTURE.md)                 |
| Copy a concrete pattern (repo, service, cache, tx, Zod) | [`CODE_PATTERNS.md`](./CODE_PATTERNS.md)                             |
| Build a new module step by step                         | [`MODULE_CHECKLIST.md`](./MODULE_CHECKLIST.md)                       |
| Understand the database schema                          | [`../database/README.md`](../database/README.md)                     |

## Quick facts

- **Runtime**: Bun · **Framework**: [Elysia](https://elysiajs.com) · **ORM**: [Drizzle](https://orm.drizzle.team)
- **Validation**: Zod, via shared primitives `zp` (output), `zc` (input), `zq` (query, coerced)
- **Layout**: vertical-slice modules under `src/modules/{name}/`; two shapes —
  **simple** (flat files, e.g. `location/`) and **complex** (per-entity folders +
  `composed/`, e.g. `iam/`)
- **Layering**: modules import **downward only** (aggregators → operations →
  master data → core); `bun run check-deps` enforces no cycles
- **Repo contract**: reads return `T | undefined` (never `null`, never throw);
  writes return `EntityRef | undefined`; every write takes `db?` for transactions
- **Service contract**: `handleX` = the only route entrypoints; typed
  `{Module}Error`; audit stamps + cache invalidation on every mutation
- **Routes**: thin `new Elysia({ prefix })` + `authPluginMacro`; validate → one
  `handleX` → wrap in `res.*`

## The four documents

| File                                             | Purpose                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| [`MODULE_STANDARD.md`](./MODULE_STANDARD.md)     | **Source of truth.** Non-negotiable module rules. If any doc disagrees, this wins. |
| [`SERVER_ARCHITECTURE.md`](./SERVER_ARCHITECTURE.md) | Project structure, design philosophy, layers, data flow, module anatomy. |
| [`CODE_PATTERNS.md`](./CODE_PATTERNS.md)         | Concrete, copy-ready snippets (Zod, repo, service, conflict, tx, cache, errors, RelationMap, routes). |
| [`MODULE_CHECKLIST.md`](./MODULE_CHECKLIST.md)   | Step-by-step build checklist, aligned to the standard.                  |

## Commands (run from `apps/server`)

- `bun run verify` — lint + typecheck + knip + check-deps (the real gate)
- `bun run typecheck` · `bun run lint` · `bun run check-deps`
- `bun run test` — `NODE_ENV=test bun test`; tests live in `src/tests/`
- `bun run db:generate` → `bun run db:migrate` (schema changes)

> Full toolchain/commands live in [`AGENTS.md`](../../AGENTS.md); deeper AI
> working instructions in [`CLAUDE.md`](../../CLAUDE.md).

## Principles

1. **Single source of truth.** `MODULE_STANDARD.md` wins for module rules; don't
   re-document the same rule in multiple places.
2. **Keep it current.** These docs were realigned to the live code (`location/`,
   `iam/`). Fix them when the code changes rather than letting them drift.
3. **AI-friendly.** Structured Markdown — clear headers, bullets, tables.
