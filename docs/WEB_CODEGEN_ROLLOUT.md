# Web Codegen — Rollout Plan

Status of the contract-driven web codegen and the plan to migrate every feature
onto it. Execute later, one feature per commit. See `WEB_CODEGEN.md` for how the
tooling works.

## Where we are

**Done**

- `defineContract` primitive (`apps/server/src/shared/contract/define-contract.ts`).
- Generator `scripts/generate-web.ts` — emits **flat** `features/<feature>/<entity>.dto.ts`
  + `<entity>.api.ts` + a barrel `index.ts` (with a preserved manual block),
  and `apps/web/src/config/endpoint.gen.ts`.
- POC: `location` fully migrated (contract + flat output + imports on barrel).
- `generate:web` / `generate:web:preview` scripts wired; legacy regex generators removed.

**Not done**

- Contracts for the other ~22 features.
- Registering each contract in `generate-web.ts` `loadContracts()`.
- Migrating each web feature off `@ikki/api-contract` → `@/lib/validation`
  (all features except `location` still import the missing `@ikki/api-contract`,
  which is a hard typecheck error).
- Deleting the old hand-written `endpoint.ts` once all features use `endpoint.gen.ts`.

## Migration order

Follow the server layer order (lower layers first) so cross-feature DTO refs
resolve. Multi-entity features are flagged.

| # | Feature | Entities | Notes |
|---|---------|----------|-------|
| 1 | location | location | ✅ done (reference) |
| 2 | uom | uom | in `material/` server dir? confirm dtoSource |
| 3 | company | company-settings | single |
| 4 | supplier | supplier | single, route registered |
| 5 | crm | customer | single |
| 6 | sales-type | sales-type | single, route registered |
| 7 | product | category, product | multi-entity |
| 8 | finance | account, expenditure, journal | multi-entity |
| 9 | hr | employee, payroll, hr | multi-entity |
| 10 | iam | user, role, assignment | multi-entity, route registered — good 2nd reference |
| 11 | inventory | stock-transaction, stock-transfer, stock-summary, stock-alert, stock-dashboard | multi-entity |
| 12 | purchasing | purchase-order, goods-receipt | multi-entity |
| 13 | payment | payment, payment-method, payment-provider, location-payment-method | multi-entity |
| 14 | sales | sales-order, sales-invoice | multi-entity |
| 15 | recipe | recipe | single, route registered |
| 16 | production | work-order | single |
| 17 | audit | audit-log | single, route registered |
| 18 | dashboard | analytics, settings | multi-entity, read-only |
| 19 | reporting | (7 report submodules) | read-only aggregators |
| 20 | material | material, category, conversion, location | hexagonal; DTO copy may need care |
| 21 | moka | configuration, scrap-history, sync-cursor | external integration |
| 22 | auth | auth, session | Layer 0; custom endpoints (login/me) |
| — | pos | — | UI-only feature, no server module — leave hand-written |

## Per-feature procedure

For each feature (do `iam` first as the multi-entity reference):

1. **Add contract(s)** to the server `*.contract.ts` (one `defineContract` per
   entity for multi-entity features). Set `feature`, `entity`, `prefix`,
   `dtoSource`, and `endpoints[]` with `dto()` / `shared()` refs.
   - Match `action` keys to the current web api keys (`list`, `detail`, `create`,
     `update`, `remove`, plus customs like `changePassword`, `approve`).
   - Custom endpoints: pick the right `method`, `path`, `input.kind`, `output.kind`.

2. **Register** the contract file import in `scripts/generate-web.ts`
   → `loadContracts()`.

3. **Delete** the old hand-written `features/<feature>/dto/` and `api/` folders
   (and their `index.ts`) so flat output has no duplicates.

4. **Regenerate**: `bun run generate:web <feature>`.

5. **Repoint imports**: change any deep imports
   (`@/features/<f>/api/...`, `@/features/<f>/dto`, `'../api'`, `'../dto'`) to the
   feature **barrel** (`@/features/<f>` or `'..'`).

6. **Verify**: `apps/web` `bun run typecheck` — the feature's generated files must
   be clean. Also `apps/server` `bun run typecheck` for the contract.

7. **Commit** per feature: `refactor(web): migrate <feature> to contract codegen`.

## Known gaps / decisions to make during rollout

- **DTO copy fidelity.** The copier strips the `defineContract` import + the
  `…Contract` export block and rewrites `@/shared/schema` → `@/lib/validation`.
  It assumes DTOs reference only `z` + shared validation. Server-only imports in
  a contract (e.g. cross-module DTO imports like `iam` importing `LocationDto`)
  need a rewrite rule — the generator currently does NOT rewrite
  `@/modules/<x>` / cross-feature imports. Plan: for cross-feature DTO refs,
  rewrite to `@/features/<x>` on copy (add a rule when we hit `iam`).

- **Custom endpoint query-keys.** The generator only special-cases `list` and
  `detail` for query keys and applies `invalidates: [<entity>Keys.lists()]` to all
  mutations. Hand-written code had richer invalidation (e.g. also invalidate
  `detail(body.id)`). Decide whether to (a) accept simpler invalidation, or
  (b) extend the contract with an optional `invalidates` hint per endpoint.

- **endpoint.gen.ts vs endpoint.ts.** Two configs coexist during migration.
  Generated features import `@/config/endpoint.gen`; legacy features still import
  `@/config/endpoint`. Once every feature is migrated, delete `endpoint.ts` and
  rename `endpoint.gen.ts` → `endpoint.ts` (single config).

- **Routes still hand-written.** Contracts are metadata-only today; Elysia routes
  are unchanged. A later phase can build routes *from* the contract (open
  question — see the earlier decision to keep handlers explicit for now).

- **material / moka.** Divergent structure; validate the DTO copy output manually
  before trusting it. May keep parts hand-written.

- **auth.** Layer-0, non-CRUD (`login`, `me`). Model as custom endpoints; verify
  the response DTOs (`UserDetailDto` cross-ref) copy correctly.

## Definition of done

- Every server module with an HTTP surface has `defineContract`(s) registered.
- `bun run generate:web` regenerates all web dto/api/endpoint without manual edits.
- No web file imports `@ikki/api-contract`; all use `@/lib/validation`.
- `apps/web` typecheck has no codegen-related errors.
- Legacy `endpoint.ts` removed; `endpoint.gen.ts` is the single config.
