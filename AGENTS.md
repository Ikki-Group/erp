# AGENTS.md

Ikki ERP — Bun monorepo. Apps: `apps/server` (Elysia + Drizzle API), `apps/web` (React 19 + Vite + TanStack), `apps/e2e` (Playwright). (`apps/web-archive` is a retired frontend — ignore it.) No `packages/*` exist yet despite the workspace glob.

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
- `bun run test` — `NODE_ENV=test bun test --bail --timeout 30000`. Tests live in `src/tests/`.
- `bun test src/tests/services/iam.test.ts` — run a single file
- `bun run check-deps` — circular dependency check via dpdm

Web (`apps/web`):

- `bun run test` — vitest
- `bun run typecheck`

## Database (from `apps/server`)

- `bun run db:generate` (from schema changes) → `bun run db:migrate`
- `bun run db:studio`, `bun run db:seed`
- **Destructive scripts are guarded**: reset/seed only run if `NODE_ENV=test` + `DATABASE_URL` contains `test-user`, OR `NODE_ENV=development` + URL contains `dev-user` (`scripts/db-scripts-helper.ts`). Point env at the right DB or they silently no-op.

## Secrets (age-encrypted)

Env files and sensitive configs are stored in the repo **encrypted** with [age](https://github.com/FiloSottile/age) — ciphertext (`*.age`) committed, plaintext gitignored. Managed via `scripts/secrets.sh {encrypt|decrypt|status}`. See `secrets/README.md` for setup and workflow. Machine-local scratch (incl. the private key `.local/age.key`) lives in `.local/`, which is fully gitignored — see `.local/README.md`.

## Generated files

- `apps/web/src/routeTree.gen.ts` is TanStack Router generated — never edit by hand.

There is currently **no server→web contract codegen**. `apps/web/src/config/endpoint.ts` is hand-written. DTOs are defined per-slice in the web app.

## Server architecture

Vertical slices under `apps/server/src/modules/<module>/`. A module groups related slices, each slice is a folder of layered files:

- `*.contract.ts` — Zod DTOs (request/response). Compose with spread-shape: `...UserMutationDto.shape`, `...zc.AuditBasic.shape`. Shared primitives come from `@/shared/schema` (`zp`, `zq`, `zc`).
- `*.repo.ts` — Drizzle data access behind an `IXxxRepo` interface. Finders return the DTO or `undefined` (never `null`); `insert`/`update` return an `EntityRef` (`{ id }`) or `undefined`. Every method takes an optional `db?: DbContext` for transactions.
- `*.service.ts` — business logic. Public entry points are `handle*` methods. They check conflicts (`checkConflict`), stamp audit fields (`stampCreate`/`stampUpdate` from `@/shared/audit`), persist, then **invalidate cache** (`CacheService.invalidateStandard(...)`) and **record an audit log** (`auditLog.record({ module, entity, action, ... })`).
- `*.internal.ts` — module-private helpers, error factories, unique-field lists.
- Module wiring: `*.module.ts`, `*.route.ts` (Elysia), `index.ts` (barrel).

Shared building blocks live in `apps/server/src/shared/` (`auth`, `cache`, `errors`, `events`, `http`, `schema`, `uow`, `audit`, ...) and infrastructure in `apps/server/src/infra/` (`database`, `cache`, `audit`). Reads are cached via `CacheService`; mutations invalidate. Audit stamps (`createdBy`/`updatedBy`/`createdAt`/`updatedAt`) are applied through the stamp helpers, not by hand.

## Deploy / CI

- Server deploys to Fly.io on push to `main` under `apps/server/**` (`.github/workflows/deploy-server.yml`). Build context is repo root; Dockerfile/config at `apps/server`.
- Active dev branch is `dev`; `main` triggers deploys.
- Commit style: conventional prefixes, frequently with emoji (e.g. `✨ feat:`, `🔧 fix:`, `♻️ refactor:`).

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`Ikki-Group/erp`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
