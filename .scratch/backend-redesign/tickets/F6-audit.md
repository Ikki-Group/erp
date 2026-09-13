# F6 · Audit trail model

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: F2 ✅

## Resolution (2026-09-13)

**Decision:** Audit is atomic (written inside the UoW, awaited, throws on failure) — consciously overriding the PRD's async claim. Full decision in [`docs/adr/0005-audit-trail.md`](../../../docs/adr/0005-audit-trail.md).

Settled Q1–Q4:
- Q1: audit atomic (F2 wins over PRD async/non-blocking). `AuditPort.record(entry, tx)` is correct as built.
- Q2: `action` = string covering CRUD + domain verbs (complete/void/ship/…), aligned with RBAC vocabulary (F5).
- Q3: old/new values per PRD (changed fields only for update); `actorName` mandatory from `Actor` (closes P1 empty-actorName).
- Q4: one user action = one audit entry on the primary entity; derived atomic effects (stock deduction) leave their trace as the movement, not a second audit row; event-driven effects not audited as user actions. Read = `audit.read` (owner default); append-only; retention unlimited for now.

## Question

What is audited, with what fidelity, and how reliably?

Press: which mutations produce an audit record; old/new value capture (full row vs changed fields vs summary); actor identity resolution (the live bug is empty `actorName`); whether audit is written inside the transaction (atomic, awaited) or emitted as an event; retention and query/UI needs. Output: an ADR defining the audit model.

## Notes

- Live P1: `auditLog.record({ userName: '', ... })` fire-and-forget, empty actor name, outside any tx.
- F2 decides whether audit is an atomic effect (in tx) or deferred (event) — so this is blocked by F2.
- Raw material: `docs/product/02-prd-core-audit.md` (review it), old ADR-0009.
