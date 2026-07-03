# AGENTS.md

Ikki ERP — Bun monorepo. Apps: `apps/server` (Elysia + Drizzle API), `apps/web` (React 19 + Vite + TanStack), `apps/e2e` (Playwright). No `packages/*` exist yet despite the workspace glob.

`CLAUDE.md` has deep module/architecture patterns (vertical slices, Zod spread-shape, repo returns `null`, cache invalidation, audit stamps). Read it before building server features. Note: several commands it lists (`bun run verify`, `bun run build`, `db:*`, `bun test` at root) do NOT exist at the repo root — they are per-app. Trust this file for commands.

## Toolchain quirks
- Linter is **oxlint**, formatter is **oxfmt** — NOT eslint/prettier. Config: `.oxlintrc.json`, `.oxfmtrc.json`.
- Server lint is type-aware (`oxlint --type-aware`); web/root is not.
- TypeScript uses `allowImportingTsExtensions` + `verbatimModuleSyntax`. Use `import type` for type-only imports.
- Server path aliases: `@/*` → `apps/server/src/*` (see `apps/server/tsconfig.json`).

## Commands
Run per-app commands with `bun --filter @ikki/server <script>` or from the app dir.

Root:
- `bun run dev:server` / `bun run dev:web`
- `bun run lint` / `bun run format` / `bun run check` (lint + format:check + knip)
- `bun run test:e2e` (Playwright, needs server + web running)

Server (`apps/server`):
- `bun run verify` — lint + typecheck + knip + check-deps (the real gate; run before finishing server work)
- `bun run typecheck` (`tsc --noEmit`)
- `bun run test` — `NODE_ENV=test bun test --bail`. Tests live in `src/tests/`.
- `bun test src/tests/services/iam.test.ts` — run a single file
- `bun run check-deps` — circular dependency check via dpdm

Web (`apps/web`):
- `bun run test` — vitest
- `bun run typecheck`

## Database (from `apps/server`)
- `bun run db:generate` (from schema changes) → `bun run db:migrate`
- `bun run db:studio`, `bun run db:seed`
- **Destructive scripts are guarded**: reset/seed only run if `NODE_ENV=test` + `DATABASE_URL` contains `test-user`, OR `NODE_ENV=development` + URL contains `dev-user` (`scripts/db-scripts-helper.ts`). Point env at the right DB or they silently no-op.

## Codegen (server contracts are source of truth)
Web endpoint config and DTOs are generated from server routes/contracts — do not hand-edit generated output.
- `bun run generate:endpoints` → `apps/web/src/config/endpoint.ts`
- `bun run generate:web` → also copies contracts to `apps/web/src/features/<module>/dto/`
- `apps/web/src/routeTree.gen.ts` is TanStack Router generated — never edit by hand.

## Deploy / CI
- Server deploys to Fly.io on push to `main` under `apps/server/**` (`.github/workflows/deploy-server.yml`). Build context is repo root; Dockerfile/config at `apps/server`.
- Active dev branch is `dev`; `main` triggers deploys.
- Commit style: conventional prefixes, frequently with emoji (e.g. `✨ feat:`, `🔧 fix:`, `♻️ refactor:`).
