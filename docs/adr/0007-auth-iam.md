# ADR-0007: Auth & IAM Model (session, access map, location scoping)

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0004 (RBAC — this resolves the active-location question ADR-0004 §4 deferred). **Revises:** ADR-0004 §4 (active location comes from the request, not a server-stored session field).

## Context

RBAC (ADR-0004) and the audit actor (ADR-0005) both depend on auth/IAM, but no ADR resolved it. The existing pieces: `AuthContext` (`userId`, `userName`, `locationId`, `permissions[]`, `isOwner`), `actorOf` deriving `Actor`, the `iam` module (user/role/assignment), and a `user_assignments` table with unique `(userId, roleId, locationId)`. The PRD says sessions live in Redis; the vision says memory (BentoCache) — a conflict. The owner added two constraints: **switching location must not call the server**, and **reduce DB/Postgres calls** (Neon serverless makes every query a network round-trip).

## Decision

### 1. Session behind a port, memory adapter now

- A `SessionStore` port with a BentoCache-backed memory adapter now; configurable to Redis later without touching the domain (mirrors the CachePort decision). Resolves the PRD-vs-vision conflict toward memory-behind-a-port.
- Session token as an HTTP-only cookie; TTL/idle-timeout configurable.

### 2. Location switching is client-side; location comes from the request

- The session does **not** store a single `activeLocationId`. Switching location is a pure frontend action with no server round-trip.
- Each request carries the target `locationId` (header). The server validates, per request, that the user has access to the claimed location.
- This **revises ADR-0004 §4**: active location is resolved from the request, not from a server-stored session field.

### 3. Access map (what the session/`/me` carries)

The materialized authorization state for a user:

```
{ userId, userName, isOwner,
  globalPermissions: string[],              // from global (locationId IS NULL) assignments
  access: { [locationId: number]: string[] } // per-location permission sets
}
```

- `GET /me` returns the **entire** access map + the list of accessible locations, so the frontend has all access data up front and switches locally.
- Assignment model ratified: `user_assignments (userId, roleId, locationId)`, `locationId IS NULL` = global. At least one Owner must always exist; system roles are immutable.

### 4. Per-request authorization

1. Resolve user + access map from the session/cache (no DB — see §6).
2. Read `locationId` from the request.
3. If the user has neither a global grant nor an `access[locationId]` entry → 403.
4. Effective permissions = `globalPermissions ∪ access[locationId]`.
5. Check the required `<slice>.<action>` (ADR-0004) is present → proceed or 403.
6. `isOwner` bypasses all checks.

### 5. Caching & invalidation

- Access maps are cached per user behind the CachePort: key `auth:access:{userId}`, moderate TTL.
- **Direct invalidation:** when a user's own assignment changes (added/removed), delete `auth:access:{userId}`.
- **Fan-out invalidation by tag:** each access-map entry is tagged `role:{roleId}`; when a role's permissions change (affecting every user with that role), invalidate **by tag** in one operation — no per-user loop.
- `GET /me` reads from this cache (filling it on miss), so the frontend always gets the current map after an invalidation.

### 6. Per-request auth path does zero DB calls

- Session lookup and access-map read are served from memory (session store + CachePort). The RBAC macro **never queries Postgres**.
- Postgres is touched **only on cache miss** (first login, or after invalidation), to re-materialize the access map via **one efficient joined query** (assignment → role → permission), never N+1.
- Normal requests therefore incur zero DB round-trips for authorization.

## Alternatives Considered

- **Store `activeLocationId` in the session; switch calls the server.** Rejected by the owner: adds a round-trip on every location switch.
- **Recompute permissions from the DB each request.** Rejected: authorization runs on every request; per-request DB queries violate the reduce-DB-calls constraint.
- **Sessions in Redis now (per PRD).** Deferred: memory behind a port is enough for a single business; Redis is an adapter swap later.

## Consequences

- **Easier:** instant client-side location switching; zero-DB auth on the hot path; one `/me` call hydrates the frontend's entire access model.
- **Harder:** invalidation must be correct (per-user on assignment change, by-tag on role change) or a user sees stale permissions until TTL. The tag-based fan-out is the mitigation.
- **Constraint:** location comes from the request and is validated every request; the RBAC macro never hits Postgres; access-map materialization is a single joined query on cache miss. `Actor.locationId` now reflects the request's location, not a session field.
