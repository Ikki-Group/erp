# D0 · Auth & IAM domain (session, active-location, user/role/assignment)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: F1 ✅ F2 ✅ F3 ✅ F4 ✅ F5 ✅ F6 ✅ (foundation complete)

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
