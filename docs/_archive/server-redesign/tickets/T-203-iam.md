# T-203: `iam` module

**Tracker row:** M.iam
**Depends on:** `location` (T-201)
**Type:** complex module (Layer 1)

## Goal
The `iam` module: users, roles, user_assignments; owns the permission vocabulary seeding used by the RBAC macro.

## Read first
- [11-complex-module.md](../11-complex-module.md) · [12-module-checklist.md](../12-module-checklist.md)
- [06-rbac.md](../06-rbac.md) §1 (permission vocabulary)

## Build
Complex layout: `user/`, `role/`, `assignment/` sub-entities + `composed/` for enriched reads (user-with-roles). Native boolean `isActive`. Role `permissions` is the source list validated against the `<module>.<action>` vocabulary. Expose:
- `api.userByCredentials` / user-read port for `auth`.
- `api.permissionsForUser(userId, locationId)` if the auth plugin consumes it.

Routes for user/role/assignment CRUD, guarded by `iam.*`.

## Definition of done
- User/role/assignment CRUD; assign/unassign roles; composed read of a user with effective permissions.
- Seed includes the owner role + the full permission vocabulary (union across modules).
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 1`, `dependsOn: ['location']`. This module defines the permission strings every route uses — keep them in sync with the `<module>.<action>` convention (spec 06). `auth` (T-103) may depend on this.
