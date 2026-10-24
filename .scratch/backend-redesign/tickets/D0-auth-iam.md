# D0 · Auth & IAM domain (session, active-location, user/role/assignment)

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: F1 ✅ F2 ✅ F3 ✅ F4 ✅ F5 ✅ F6 ✅ (foundation complete)

## Resolution (2026-09-13)

**Decision:** Session behind a memory-backed port; location switching is client-side (location comes from the request, validated per request); a per-user access map (global + per-location permissions) is materialized, cached, and returned whole by `GET /me`; per-request auth path does zero DB calls. Full decision in [`docs/adr/0007-auth-iam.md`](../../../docs/adr/0007-auth-iam.md).

Settled Q1–Q6:
- Q1: session behind `SessionStore` port, BentoCache memory now, Redis later.
- Q2/Q4: location switching does NOT call the server — location comes from a request header, validated per request; session holds identity + full access map (no single activeLocationId). Revises ADR-0004 §4.
- Q3: assignment model `(userId, roleId, locationId)`, NULL = global; effective perms = global ∪ access[loc]; owner bypass.
- Q5: cache `auth:access:{userId}`; direct invalidation on user-assignment change; by-tag `role:{roleId}` fan-out on role-permission change.
- Q6: zero DB calls on the per-request auth path; Postgres only on cache miss via one joined query (no N+1).

## Question

Press the Auth & IAM domain that RBAC (ADR-0004) depends on but which no ADR yet resolves:
- **Session model** — session-based auth (BentoCache memory per vision); what the session carries (userId, active location, cached permissions?).
- **Active-location resolution** — ADR-0004 §4 defers "how the active location is resolved from the session" to here. Decide it.
- **User / Role / Assignment** — the user↔role↔location assignment model, permission collection, owner bootstrap (at least one Owner), system-role immutability.
- **AuthContext / `actorOf`** — how `Actor` (id + name, per ADR-0005) is derived from the authenticated request; closes the empty-`actorName` P1 at its source.

## Notes

- Raw material: `docs/product/02-prd-core.md` (Auth/IAM sections), `02-prd-core-permissions.md`. Existing: `iam` (complex: user/role/assignment/composed), `auth` module, `shared/auth/` (permission.ts, actor.ts).
- **Why this exists:** review of the foundation ADRs found RBAC (ADR-0004) and audit actor (ADR-0005) both depend on auth/iam, but the domain layer had no ticket for it. This is that ticket.
- Blocks D1 (Core) — everything else scopes by location, which comes from the session resolved here.
- Consult grilling + domain-modeling.
