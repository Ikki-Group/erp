# AGENTS.md

Ikki ERP — Bun monorepo. Apps: `apps/server` (Elysia + Drizzle API), `apps/web` (React 19 + Vite + TanStack), `apps/e2e` (Playwright). Package: `packages/contract` (`@ikki/contract`) — the Zod DTOs shared by server and web.

This file is the single source of truth for conventions and commands. `CLAUDE.md` only routes here. Read the **Server architecture** section below before building server features. Note: several commands (`bun run verify`, `bun run build`, `db:*`) do NOT exist at the repo root — they are per-app.

## Toolchain quirks

- Linter is **oxlint**, formatter is **oxfmt** — NOT eslint/prettier. Config: `.oxlintrc.json`, `.oxfmtrc.json`.
- Server lint is type-aware (`oxlint --type-aware`); web/root is not.
- TypeScript uses `allowImportingTsExtensions` + `verbatimModuleSyntax`. Use `import type` for type-only imports.
- Server path aliases (see `apps/server/tsconfig.json`): `@/*` → `apps/server/src/*`, plus `@/db`, `@/infra/*`, `@/shared/*`, `@/modules/*`.

## Commands

Run per-app commands with `bun --filter @ikki/server <script>` or from the app dir.

Root:

- `bun run dev:server` / `bun run dev:web`
- `bun run lint` / `bun run format` / `bun run check` (lint + format:check + knip)
- `bun run test:e2e` (Playwright, needs server + web running)

Server (`apps/server`):

- `bun run verify` — lint + typecheck + knip + check-deps (the real gate; run before finishing server work)
- `bun run typecheck` (`tsc --noEmit`)
- `bun run test` — resets + seeds the test DB (`.env.test`, database name must contain `test`), then runs all tests. Tests live in `src/tests/`.
- `bun run test:unit` — pure unit tests only (no DB reset)
- `bun test src/tests/services/iam.test.ts` — run a single file
- `bun run check-deps` — circular dependency check via dpdm

Web (`apps/web`):

- `bun run test` — vitest
- `bun run typecheck`

## Database (from `apps/server`)

- `bun run db:generate` (from schema changes) → `bun run db:migrate`
- `bun run db:studio`, `bun run db:seed`
- `bun run dev:db:reset` — drop everything, migrate, seed the dev DB.
- **Destructive scripts are guarded**: reset/seed only run if `NODE_ENV=test` + the database name contains `test`, OR `NODE_ENV=development` + URL contains `dev-user` (`scripts/db-scripts-helper.ts`). Point env at the right DB or they silently no-op.
- Migrations were squashed to `0000_init`; regenerate with `db:generate` after schema edits.

## Secrets (age-encrypted)

Env files and sensitive configs are stored in the repo **encrypted** with [age](https://github.com/FiloSottile/age) — ciphertext (`*.age`) committed, plaintext gitignored. Managed via `scripts/secrets.sh {encrypt|decrypt|status}`. See `secrets/README.md` for setup and workflow. Machine-local scratch (incl. the private key `.local/age.key`) lives in `.local/`, which is fully gitignored — see `.local/README.md`.

## Generated files

- `apps/web/src/routeTree.gen.ts` is TanStack Router generated — never edit by hand.

DTOs live once in `packages/contract/src/**` and are imported as `@ikki/contract/<path>` (e.g. `@ikki/contract/location`, `@ikki/contract/pos/order`, `@ikki/contract/schema`, `@ikki/contract/http`). Web `features/*/dto/index.ts` only re-export them plus UI-only label lists. URL paths are in `apps/web/src/config/endpoint.ts` (hand-written, verified against server routes).

## Server architecture

See ADR-0019. Modules live under `apps/server/src/modules/<module>/`; complex modules have one sub-folder per sub-entity. Files per slice:

- `index.ts` — `createXModule(infra: Infra, deps)` factory + the types/DTOs neighbours may import. **Only import other modules through their `index.ts`.** Wiring happens in `src/modules/index.ts` (typed, dependency order).
- `*.repo.ts` — Drizzle data access (plain class). Finders return the DTO or `undefined`; `insert`/`update` return `{ id }` or `undefined`. Every method takes `db: Db = this.db` last so it can join a transaction.
- `*.service.ts` — one deps object (`interface Deps extends Infra { repo; neighbour: Pick<NeighbourService, ...> }`). Public entry points are `handle*`. Mutations: one `uow.run(async (tx) => ...)` containing all writes (incl. cross-module writes, passing `tx`) and `audit.record(tx, actor, { module, entity, entityId, action, summary, ... })`. Stamp fields via `stampCreate`/`stampUpdate`.
- `*.calculator.ts` — pure money/qty math over `Money`/`Qty` (`shared/domain`), unit-tested in `src/tests/unit/`. Never use JS `number` for money.
- `*.internal.ts` — error factories, unique-field lists.
- `*.route.ts` — `new Elysia({ prefix }).use(authGuard)`; every non-public handler declares `permission: '<slice>.<action>'` (catalog: `@ikki/contract/permissions`) and receives a typed `auth`.

There is **no business-data cache and no event bus**. `infra/cache.ts` is only for auth (sessions, access map). After changing a user's roles/sessions call `invalidateUserAccess` / `invalidateRoleAccess` / `forgetSessions` (`server/auth/*`) after commit.

## Deploy / CI

- Server deploys to Fly.io on push to `main` under `apps/server/**` (also touch `packages/contract/**` changes) (`.github/workflows/deploy-server.yml`). Build context is repo root; Dockerfile/config at `apps/server`.
- Active dev branch is `dev`; `main` triggers deploys.
- Commit style: conventional prefixes, frequently with emoji (e.g. `✨ feat:`, `🔧 fix:`, `♻️ refactor:`).

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`Ikki-Group/erp`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### UI Components & Design System

`apps/web/DESIGN.md` is the sole visual authority (tokens, type, radius, elevation, touch targets). Use the `ui-components` skill when building UI features, forms, tables, or checking consistency (e.g. numbers are right-aligned, use cell components in tables).

**Quick links:**

- Live catalog: `/design-system` on the web dev server (`bun run dev:web`)
- Usage recipes: apps/web/COMPONENT_GUIDE.md
- Skill: .agents/skills/ui-components/SKILL.md
