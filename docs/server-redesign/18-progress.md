# Progress Tracker

The single source of truth for implementation status. **The implementer updates this file after every work unit** — before starting (`todo`→`in-progress`) and after finishing + verifying (`in-progress`→`done`). A fresh session reads this file first to know where things stand.

## How to use

1. Open [16-execution-backlog.md](./16-execution-backlog.md) to see order; open this file to see status.
2. Pick the next `todo` row whose **Deps** are all `done`.
3. Set its status to `in-progress`. Open its ticket in [tickets/](./tickets/).
4. Build it (follow [12-module-checklist.md](./12-module-checklist.md)).
5. Run `bun run verify` + `bun run test` from `apps/server`. Set **Verify** to ✅ only when both pass.
6. Set status to `done`, fill **Commit** and any **Notes**. Move to the next row.

**Status values:** `todo` · `in-progress` · `done` · `blocked` (put the reason in Notes and stop; escalate).

## Phase 0 — Shared Foundation (build first)

| ID | Item | Ticket | Status | Verify | Deps | Commit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0.1 | Neon WebSocket client + `DbContext`/`Tx` | [T-001](./tickets/T-001-db-client.md) | todo | ⬜ | — | | |
| P0.2 | `UnitOfWork` port + adapter | [T-002](./tickets/T-002-uow.md) | todo | ⬜ | P0.1 | | |
| P0.3 | `CachePort` + memory adapter | [T-003](./tickets/T-003-cache-port.md) | todo | ⬜ | — | | |
| P0.4 | `EventBusPort` + memory adapter | [T-004](./tickets/T-004-event-bus.md) | todo | ⬜ | — | | |
| P0.5 | `AuditPort` + adapter | [T-005](./tickets/T-005-audit-port.md) | todo | ⬜ | P0.1 | | |
| P0.6 | `Money` + `Qty` + `weightedAvgCost` | [T-006](./tickets/T-006-value-objects.md) | todo | ⬜ | — | | |
| P0.7 | RBAC macro + `actorOf` + `userName` | [T-007](./tickets/T-007-rbac.md) | todo | ⬜ | — | | |
| P0.8 | `ModuleDescriptor` + composer | [T-008](./tickets/T-008-module-registry.md) | todo | ⬜ | — | | |
| P0.9 | Schema: integer→boolean + migrate | [T-009](./tickets/T-009-boolean-schema.md) | todo | ⬜ | — | | |

## Phase 1 — Layer 0 (Core)

| ID | Module | Ticket | Status | Verify | Deps | Commit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M.audit | `audit` | [T-101](./tickets/T-101-audit.md) | todo | ⬜ | Phase 0 | | |
| M.company | `company` | [T-102](./tickets/T-102-company.md) | todo | ⬜ | Phase 0 | | |
| M.auth | `auth` | [T-103](./tickets/T-103-auth.md) | todo | ⬜ | P0, iam | | build after iam if it needs user lookups |

## Phase 2 — Layer 1 (Master Data)

| ID | Module | Ticket | Status | Verify | Deps | Commit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M.location | `location` | [T-201](./tickets/T-201-location.md) | todo | ⬜ | Phase 0 | | golden-path reference — build first, get reviewed |
| M.uom | `uom` | [T-202](./tickets/T-202-uom.md) | todo | ⬜ | Phase 0 | | |
| M.iam | `iam` | [T-203](./tickets/T-203-iam.md) | todo | ⬜ | location | | |
| M.material | `material` | [T-204](./tickets/T-204-material.md) | todo | ⬜ | uom, location | | |
| M.supplier | `supplier` | [T-205](./tickets/T-205-supplier.md) | todo | ⬜ | material, uom | | |
| M.payment-method | `payment-method` | [T-206](./tickets/T-206-payment-method.md) | todo | ⬜ | location | | |
| M.menu | `menu` | [T-207](./tickets/T-207-menu.md) | todo | ⬜ | location | | |
| M.recipe | `recipe` | [T-208](./tickets/T-208-recipe.md) | todo | ⬜ | material, uom, menu | | |

## Phase 3 — Layer 2 (Operations)

| ID | Module | Ticket | Status | Verify | Deps | Commit | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M.inv-stock | `inventory/stock` | [T-301](./tickets/T-301-inventory-stock.md) | todo | ⬜ | material, recipe, uom | | **CRITICAL** — P0 fixes; read spec 15 |
| M.pos-shift | `pos/shift` | [T-302](./tickets/T-302-pos-shift.md) | todo | ⬜ | location | | |
| M.pos-table | `pos/table` | [T-303](./tickets/T-303-pos-table.md) | todo | ⬜ | location | | |
| M.pos-voucher | `pos/voucher` | [T-304](./tickets/T-304-pos-voucher.md) | todo | ⬜ | Phase 0 | | |
| M.pos-order | `pos/order` | [T-305](./tickets/T-305-pos-order.md) | todo | ⬜ | inv-stock, menu, company, payment-method, recipe, uom, material, shift, table, voucher | | **CRITICAL** — P0 fixes; read spec 14 |
| M.inv-receiving | `inventory/receiving` | [T-306](./tickets/T-306-inventory-receiving.md) | todo | ⬜ | material, supplier, inv-stock | | |
| M.inv-transfer | `inventory/transfer` | [T-307](./tickets/T-307-inventory-transfer.md) | todo | ⬜ | material, inv-stock | | |
| M.inv-opname | `inventory/opname` | [T-308](./tickets/T-308-inventory-opname.md) | todo | ⬜ | material, inv-stock | | |
| M.production | `production` | [T-309](./tickets/T-309-production.md) | todo | ⬜ | material, inv-stock, uom | | |

## Out of scope (not tracked this pass)

`finance`, `hr`, `crm`, `reporting`.

## Open decisions (must be resolved before the dependent ticket starts)

| Decision | Blocks | Spec |
| --- | --- | --- |
| Strict-stock vs permissive stock | T-301, T-305 | [15](./15-migrate-inventory-stock.md) §DeductStockPort |
| Per-location tax? (default: single company rate) | T-305 | [14](./14-migrate-pos-order.md) §tax |
| `auth` build order vs `iam` | T-103 | [16](./16-execution-backlog.md) §1.3 |

## Rollup

- Phase 0: 0 / 9 done
- Phase 1: 0 / 3 done
- Phase 2: 0 / 8 done
- Phase 3: 0 / 9 done
- **Total: 0 / 29 done**

> Update the rollup counts when you mark a row `done`.
