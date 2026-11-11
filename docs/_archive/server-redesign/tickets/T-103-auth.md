# T-103: `auth` module

**Tracker row:** M.auth
**Depends on:** Phase 0 (T-007), `iam` (T-203) if user lookups needed
**Type:** simple module (Layer 0)

## Goal
The `auth` module: login/logout, session issuing, and the auth plugin that resolves `AuthContext` (incl. `userName` + permissions).

## Read first
- [10-simple-module.md](../10-simple-module.md) · [06-rbac.md](../06-rbac.md)

## Build
- Use-cases: `login` (validate credentials → create session), `logout` (destroy session + invalidate auth cache).
- The auth plugin (`resolveAuth`) loads userId, locationId, permissions, and **userName** into `AuthContext` (the `userName` work is shared with T-007).
- Routes: `POST /auth/login`, `POST /auth/logout`. **`login` is one of the three routes with NO `permission`** (spec 06 §4). `logout` requires a logged-in session (`auth: true`, no permission).

## Definition of done
- Login issues a session cookie; a guarded route then works; logout invalidates.
- `AuthContext.userName` is populated (verified via an audited action having non-empty `actorName`).
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
**Open decision (18-progress):** if `login` needs user lookups from `iam`, build `iam` (T-203) first or inject a user-read port. `layer: 0`.
