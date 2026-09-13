# Ticket Index & Frontier

Local tracker has no native blocking, so the frontier is rendered here by convention. A ticket is **takeable** when every ticket in its `blocked-by` is closed. Claim a ticket by setting `claimed-by` in its body before any work. Resolve one ticket per session (except research).

## Foundation tickets

| Ticket | Type | blocked-by | Status | Takeable? |
| --- | --- | --- | --- | --- |
| [F1 · Canonical module standard](./F1-module-standard.md) | grilling | — | ✅ done | — |
| [F2 · Transaction & atomic-effect model](./F2-transaction-atomicity.md) | grilling | F1 ✅ | open | ✅ **frontier** |
| [F3 · Money & quantity precision](./F3-money-precision.md) | grilling | F1 ✅ | open | ✅ **frontier** |
| [F4 · Concurrency & locking](./F4-concurrency.md) | grilling | F2 | open | ⛔ blocked |
| [F5 · RBAC & permissions](./F5-rbac-permissions.md) | grilling | F1 ✅ | open | ✅ **frontier** |
| [F6 · Audit trail](./F6-audit.md) | grilling | F2 | open | ⛔ blocked |

## Dependency shape

```
F1 (module standard) ──┬─▶ F2 (transactions) ──┬─▶ F4 (concurrency)
                       │                        └─▶ F6 (audit)
                       ├─▶ F3 (money)
                       └─▶ F5 (rbac)
```

F1 is the root: it unblocks everything, and its outcome (module shape for GPT-Luna) also shapes how every later ADR is written.

## Domain tickets

Still in the fog — see MAP.md "Not yet specified". They graduate into tickets as the foundation tickets they depend on close. Order of graduation (planned): Core → Master Data → Costing → Menu/Recipe → Inventory → POS → Production.

## Current frontier (takeable now)

- **F2 · Transaction & atomic-effect model** — recommended next (unblocks F4, F6, and the whole POS/inventory P0 fix).
- **F3 · Money & quantity precision** — takeable in parallel.
- **F5 · RBAC & permissions** — takeable in parallel.

Recommended order: F2 next (it unblocks the most and fixes the live P0), then F3, then F5.
