# 02: Auth & IAM

**What to build:** A user can log in and get a session; `GET /me` returns their full access map (all reachable locations + per-location permissions); the frontend switches location with no server call, and every request is authorized against the claimed location with zero DB calls on the hot path.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Login/logout via `SessionStore`; session carries identity + materialized access map (ADR-0007).
- [ ] `GET /me` returns the whole access map (global + per-location permissions) and accessible locations.
- [ ] Per-request authorization: location from request header, validated against the access map; effective perms = global ∪ access[location]; owner bypass; 403 otherwise (ADR-0004, 0007).
- [ ] Access map cached (`auth:access:{userId}`); invalidated per-user on assignment change and by tag `role:{roleId}` on role change.
- [ ] Per-request auth path does zero DB calls; access map re-materialized only on cache miss via one joined query (no N+1).
- [ ] User/role/assignment CRUD via `handle*` with `<slice>.<action>` permissions; at least one Owner enforced; system roles immutable.
- [ ] Unit tests (permission resolution) + integration tests (login → /me → authorized request); `verify` + `test` pass.
