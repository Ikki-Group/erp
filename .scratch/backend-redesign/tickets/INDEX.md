# Ticket Index & Frontier

Local tracker has no native blocking, so the frontier is rendered here by convention. A ticket is **takeable** when every ticket in its `blocked-by` is closed. Claim a ticket by setting `claimed-by` in its body before any work. Resolve one ticket per session (except research).

## Foundation tickets — ALL DONE ✅

| Ticket | Type | blocked-by | Status |
| --- | --- | --- | --- |
| [F1 · Canonical module standard](./F1-module-standard.md) | grilling | — | ✅ done |
| [F2 · Transaction & atomic-effect model](./F2-transaction-atomicity.md) | grilling | F1 | ✅ done |
| [F3 · Money & quantity precision](./F3-money-precision.md) | grilling | F1 | ✅ done |
| [F4 · Concurrency & permissive stock](./F4-concurrency.md) | grilling | F2 | ✅ done |
| [F5 · RBAC & permissions](./F5-rbac-permissions.md) | grilling | F1 | ✅ done |
| [F6 · Audit trail](./F6-audit.md) | grilling | F2 | ✅ done |

ADRs produced: `docs/adr/0001`–`0006`. Structural + value + access + audit + concurrency glossary in `CONTEXT.md`.

## Domain tickets

| Ticket | Type | blocked-by | Status | Takeable? |
| --- | --- | --- | --- | --- |
| [D0 · Auth & IAM (session, active-location, user/role)](./D0-auth-iam.md) | grilling | foundation ✅ | open | ✅ **frontier** |
| [D1 · Core (Location, Company, Numbering)](./D1-core.md) | grilling | D0 | open | ⛔ blocked |
| [D2 · Master Data (Material, UoM, Supplier)](./D2-master-data.md) | grilling | D1 | open | ⛔ blocked |
| [D3 · Costing (weighted avg, transfer cost, HPP)](./D3-costing.md) | grilling | D2 | open | ⛔ blocked |
| [D4 · Menu & Recipe](./D4-menu-recipe.md) | grilling | D2 | open | ⛔ blocked |
| [D5 · Inventory (stock, transfer, opname, receiving)](./D5-inventory.md) | grilling | D3 | open | ⛔ blocked |
| [D6 · POS (order, split, void, shift, table)](./D6-pos.md) | grilling | D4, D5 | open | ⛔ blocked |
| [D7 · Production (semi-finished)](./D7-production.md) | grilling | D5 | open | ⛔ blocked |

### Domain dependency shape

```
D0 (auth/iam) ─▶ D1 (core) ─▶ D2 (master data) ─┬─▶ D3 (costing) ─▶ D5 (inventory) ─┬─▶ D6 (POS)
                                                └─▶ D4 (menu/recipe) ────────────────┘
                                                        D5 ─▶ D7 (production)
```

## Current frontier (takeable now)

- **D0 · Auth & IAM** — start of the domain layer (added after foundation-ADR review; RBAC/audit depend on it).

After D0–D7 close, the ADRs + CONTEXT.md consolidate into a handoff spec for `/to-tickets` (the map's destination).
