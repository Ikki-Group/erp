# Auth review action items

## Goal

Improve auth code quality and maintain the current cross-origin Bearer-token architecture. Do not add cookie credentials or backward-compatibility layers.

## Action items

- [x] Define the contract boundary for `/auth/me`: keep `UserDetailDto` as the canonical IAM domain read-model reference; auth consumes the public IAM composed contract without duplicating the shape.
- [x] Make `/me` data authoritative and consistent: assignments come from `UserDetailDto`; global scope comes from global assignment/owner state; effective permissions are normalized from the auth access map.
- [x] Preserve the current Bearer-token transport for cross-DNS deployment. No `credentials: 'include'`, cookies, or compatibility fallbacks were added.
- [x] Enforce the owner invariant at the domain boundary: location-scoped owner assignments are rejected with `OWNER_ASSIGNMENT_MUST_BE_GLOBAL`; global assignment state is tracked independently from permission count.
- [x] Remove obsolete client API surface after client-side switching: `switchLocation` is synchronous and `isSwitching` was removed.
- [x] Add integration coverage for the multi-location `/me` projection and access map. Assigned/unassigned request authorization remains covered by the auth plugin path but requires the configured test database to execute.
- [x] Fix the CORS configuration using Elysia's final composed app; source-level `OPTIONS /auth/me` verification returns `204` with `Access-Control-Allow-Origin`. The already-running port `4000` process still needs a restart to load it.
- [ ] Run the full integration suite with a configured test database, then review the resulting diff before committing. `bun run verify` completed lint/typecheck/knip/check-deps; integration tests were blocked by the database guard.
