# Implementation Plan: Server Critical Fixes

## Overview

Fix 5 critical/high-priority issues in `apps/server`: type mismatch in `IamAuthPort`, JWT expiration units bug, open CORS policy, lint errors blocking verify gate, and a TypeScript error in the recipe service test. Each fix is isolated and can be implemented independently. Verification is done via `bun run verify` (lint + typecheck + knip + check-deps).

## Tasks

- [x] 1. Fix IamAuthPort return type mismatch
  - [x] 1.1 Update auth.service.ts imports and interface
    - File: `apps/server/src/modules/auth/auth.service.ts`
    - Change the import from `UserDto` to `UserDetailDto` (from `@/modules/iam`)
    - Update `IamAuthPort.getUserDetail` return type: `Promise<UserDto>` → `Promise<UserDetailDto>`
    - Update `verifyToken` method return type: `Promise<UserDto>` → `Promise<UserDetailDto>`
    - Update `handleGetById` method return type: `Promise<UserDto | undefined>` → `Promise<UserDetailDto | undefined>`
    - Verify with `bun run typecheck` from `apps/server`
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Fix JWT expiresIn units bug
  - [x] 2.1 Fix JWT_EXPIRES_IN transform in env.ts
    - File: `apps/server/src/config/env.ts`
    - Change the `JWT_EXPIRES_IN` transform to divide the `ms()` result by 1000 (milliseconds → seconds)
    - Add validation: throw an error if the resulting value is 0, negative, or `undefined`
    - _Requirements: 2.1, 2.3_

  - [x] 2.2 Fix session service expiredAt Date math
    - File: `apps/server/src/modules/session/session.service.ts`
    - Change `new Date(createdAt.getTime() + env.JWT_EXPIRES_IN)` to `new Date(createdAt.getTime() + env.JWT_EXPIRES_IN * 1000)`
    - Since `env.JWT_EXPIRES_IN` is now in seconds, Date math needs milliseconds
    - Verify with `bun run typecheck` from `apps/server`
    - _Requirements: 2.2_

- [x] 3. Add CORS restriction for production
  - [x] 3.1 Add CORS_ORIGINS env var and production validation
    - File: `apps/server/src/config/env.ts`
    - Add `CORS_ORIGINS` field to the Env schema: optional string, comma-separated, transformed to `string[]`
    - Add post-parse validation: if `APP_ENV === 'production'` and `CORS_ORIGINS` is empty/unset, `process.exit(1)` with error message
    - _Requirements: 3.1, 3.3_

  - [x] 3.2 Configure CORS in app.ts with env.CORS_ORIGINS
    - File: `apps/server/src/app.ts`
    - Import `env` from `@/config/env`
    - Change `.use(cors())` to `.use(cors({ origin: env.CORS_ORIGINS ?? true }))`
    - `true` allows all origins in dev/test; the array restricts in production
    - Verify with `bun run typecheck` from `apps/server`
    - _Requirements: 3.1, 3.2_

- [x] 4. Fix lint errors blocking verify gate
  - [x] 4.1 Fix goods-receipt.contract.ts lint errors
    - File: `apps/server/src/modules/purchasing/goods-receipt.contract.ts`
    - Add `// oxlint-disable-next-line eslint/no-underscore-dangle -- Reserved for future item mutation endpoint` before the `_GoodsReceiptNoteItemMutationDto` declaration
    - Change `// @ts-ignore` to `// @ts-expect-error`
    - _Requirements: 4.1_

  - [x] 4.2 Fix unsafe type assertion lint errors in repos
    - Files:
      - `apps/server/src/modules/crm/customer.repo.ts` (lines 68, 86, 101, 112)
      - `apps/server/src/modules/inventory/stock-transaction/stock-transaction.repo.ts` (line 67)
      - `apps/server/src/modules/reporting/procurement-reporting/procurement-reporting.repo.ts` (lines 117, 163, 218, 266)
      - `apps/server/src/modules/reporting/crm-reporting/crm-reporting.repo.ts` (line 27)
    - Add `// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Drizzle raw SQL result matches contract shape` before each flagged line
    - _Requirements: 4.2_

  - [x] 4.3 Fix await-thenable errors in database-helpers.test.ts
    - File: `apps/server/src/tests/unit/database-helpers.test.ts`
    - Remove `await` from lines 93, 100, 105, 110 (the `eqIf` and `notDeleted` assertions)
    - These helpers return `SQL | undefined`, not Promises
    - _Requirements: 4.3_

  - [x] 4.4 Fix underscore-dangle in stock-summary.service.test.ts
    - File: `apps/server/src/tests/unit/stock-summary.service.test.ts`
    - Add `// oxlint-disable-next-line eslint/no-underscore-dangle` before line 72 (`for (const _item of data)`)
    - _Requirements: 4.4_

- [x] 5. Fix TypeScript error in recipe service test
  - [x] 5.1 Fix FakeRecipeRepo.update() audit fields
    - File: `apps/server/src/tests/unit/recipe.service.test.ts`
    - In `FakeRecipeRepo.update()`, after spreading `...existing` and `...data`, explicitly reassign audit fields from `existing`:
      ```typescript
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
      createdBy: existing.createdBy,
      updatedBy: existing.updatedBy,
      ```
    - This prevents `data` from overwriting audit fields with `undefined`
    - Verify with `bun run typecheck` from `apps/server`
    - _Requirements: 5.1, 5.2_

- [x] 6. Final checkpoint — Run full verify gate
  - Run `bun run verify` from `apps/server`
  - Confirm all listed lint errors and TypeScript errors are resolved
  - Command should exit with code 0
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1–1.3, 2.1–2.3, 3.1–3.3, 4.1–4.4, 5.1–5.2_

## Notes

- All file paths are relative to the monorepo root (`apps/server/src/...`)
- Run verification commands from `apps/server` directory or use `bun --filter @ikki/server <script>`
- The verify command is: `bun run lint && bun run typecheck && bun run knip && bun run check-deps`
- No property-based testing applies — these are config, type annotation, lint, and test mock fixes
- Each task is independent and can be implemented in any order (except the final checkpoint)
- After all fixes, existing production sessions with incorrect expiry should be invalidated on deploy

## Task Dependency Graph

```json
{
	"waves": [
		{ "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "4.3", "4.4", "5.1"] },
		{ "id": 1, "tasks": ["2.2", "3.2", "4.2"] }
	]
}
```
