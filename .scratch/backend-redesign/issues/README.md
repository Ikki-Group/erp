# Implementation Tickets

Tracer-bullet tickets from [`../SPEC.md`](../SPEC.md) (which collapses ADR-0001…0014). No backward-compat: modules are **replaced**, not migrated. Each ticket is one vertical slice sized for a single fresh context window. Work the **frontier** — any ticket whose blockers are all done. `/clear` context between tickets.

| # | Ticket | Blocked by |
| --- | --- | --- |
| 01 | Foundation kernel + schema replace | — (start here) |
| 02 | Auth & IAM | 01 |
| 03 | Core (Location, Company, Numbering) | 02 |
| 04 | Master Data (Material, UoM, Supplier) | 03 |
| 05 | Costing (weighted avg, HPP) | 04 |
| 06 | Menu & Recipe | 04 |
| 07 | Inventory stock core (recordMovement) | 05 |
| 08 | Inventory receiving | 07 |
| 09 | Inventory transfer | 07 |
| 10 | Inventory opname | 07 |
| 11 | Production | 07 |
| 12 | POS shift | 03 |
| 13 | POS table | 03 |
| 14 | POS voucher & discount | 06 |
| 15 | POS order lifecycle (the P0 fix) | 06, 07, 12, 13, 14 |

## Dependency shape

```
01 ─▶ 02 ─▶ 03 ─┬─▶ 04 ─┬─▶ 05 ─▶ 07 ─┬─▶ 08
                │       └─▶ 06 ──┐     ├─▶ 09
                │                │     ├─▶ 10
                ├─▶ 12 ──────────┤     └─▶ 11
                └─▶ 13 ──────────┤
                       06 ─▶ 14 ─┤
                                 └─▶ 15 (needs 06,07,12,13,14)
```

Ticket 15 (order lifecycle) is the capstone: it closes the live P0 (fire-and-forget stock deduction) and the P1 (unenforced RBAC) in real code. After 01, tickets 02→03 are linear; from 04 the tree fans out (master-data feeds costing + menu; stock core feeds receiving/transfer/opname/production; POS shift/table can start right after core).

## Suggested order

01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15
(parallelizable where the tree allows: 12/13 after 03; 06 alongside 05; 08/09/10/11 after 07.)
