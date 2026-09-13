# F6 · Audit trail model

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: F2

## Question

What is audited, with what fidelity, and how reliably?

Press: which mutations produce an audit record; old/new value capture (full row vs changed fields vs summary); actor identity resolution (the live bug is empty `actorName`); whether audit is written inside the transaction (atomic, awaited) or emitted as an event; retention and query/UI needs. Output: an ADR defining the audit model.

## Notes

- Live P1: `auditLog.record({ userName: '', ... })` fire-and-forget, empty actor name, outside any tx.
- F2 decides whether audit is an atomic effect (in tx) or deferred (event) — so this is blocked by F2.
- Raw material: `docs/product/02-prd-core-audit.md` (review it), old ADR-0009.
