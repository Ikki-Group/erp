# T-007: RBAC macro + `actorOf` + `AuthContext.userName`

**Tracker row:** P0.7
**Depends on:** —
**Type:** foundation

## Goal
`server/plugins/rbac.plugin.ts` exports the `rbac` macro enforcing a declared `permission`; `shared/auth/actor.ts` exports `actorOf`; `AuthContext` carries `userName` resolved by the auth plugin.

## Read first
- [06-rbac.md](../06-rbac.md)

## Build
1. Extend `AuthContext` (`shared/auth/permission.ts`) with `userName: string`. Update the auth plugin's `resolveAuth` to load and cache the user's name alongside permissions.
2. Create `shared/auth/actor.ts`: `Actor` type `{ id, name, locationId }` + `actorOf(auth)` (spec 06 §5).
3. Create `server/plugins/rbac.plugin.ts`: the `rbac` Elysia macro adding a `permission(required)` option that throws `ForbiddenError` when `!hasPermission(auth, required)` (spec 06 §2).

## Definition of done
- A route with `permission: 'x.y'` rejects a user lacking `x.y` with 403; owner bypasses.
- `actorOf(auth).name` is non-empty for a logged-in user.
- Self-check: integration test hitting a guarded route with/without the permission.
- `bun run verify` + `bun run test` green.

## Notes / gotchas
`userName` here is what closes the empty-audit gap (ADR-0009). Every non-public route will declare a `permission` (spec 06 §4: only login/register/health are exempt).
