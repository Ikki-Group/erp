# Architecture Decision Records

Battle-tested decisions for the Ikki ERP backend redesign, produced by grilling each one against the code and the AI-generated PRDs (`docs/product/`) rather than accepting them unexamined. Domain vocabulary lives in the root `CONTEXT.md`; the planning trail is archived under `.scratch/backend-redesign/`.

Scope: **foundation + core operations** (Core, Master Data, Costing, Menu, POS, Inventory, Production). Finance, HR, and CRM are deferred to a later effort.

## Foundation

| ADR                                            | Decision                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| [0001](./0001-module-standard.md)              | Module standard — flat-hybrid with pure-domain separation               |
| [0002](./0002-transaction-atomic-effects.md)   | Transaction boundary & atomic-effect model (UoW + hybrid effects)       |
| [0003](./0003-money-precision.md)              | Money & quantity precision (Money/Qty, amount 0dp / cost 4dp / qty 6dp) |
| [0004](./0004-rbac-permissions.md)             | RBAC & permissions (`<slice>.<action>`, enforced per route)             |
| [0005](./0005-audit-trail.md)                  | Audit trail (atomic, actorName mandatory)                               |
| [0006](./0006-concurrency-permissive-stock.md) | Concurrency & permissive stock (non-blocking for a small UMKM)          |

## Domain

| ADR                                  | Decision                                                              |
| ------------------------------------ | --------------------------------------------------------------------- |
| [0007](./0007-auth-iam.md)           | Auth & IAM (session, access map, client-side location switching)      |
| [0008](./0008-core-domain.md)        | Core (Location, Company, Numbering)                                   |
| [0009](./0009-master-data-domain.md) | Master Data (Material, UoM chain, Supplier, assignment)               |
| [0010](./0010-costing-domain.md)     | Costing (per-location weighted average, transfer cost, HPP)           |
| [0011](./0011-inventory-domain.md)   | Inventory (stock ledger, transfer, opname, receiving)                 |
| [0012](./0012-menu-recipe-domain.md) | Menu & Recipe (per-location, one active recipe, price snapshot)       |
| [0013](./0013-pos-domain.md)         | POS (order lifecycle, payments, void, shift, table, discount/voucher) |
| [0014](./0014-production-domain.md)  | Production (semi-finished items)                                      |

## Web (frontend)

| ADR                                             | Decision                                                      |
| ----------------------------------------------- | ------------------------------------------------------------- |
| [0015](./0015-web-query-keys-location-cache.md) | Web query-key convention & location-scoped cache partitioning |
| [0016](./0016-web-error-boundary-policy.md)     | Web error-boundary & query freshness policy (tiers, Suspense) |

## Cross-cutting threads

- **Permissive / non-blocking** (0006): sales, production consume, void reversal, opname, and min-stock never block the user; the deliberate exceptions are transfer-out, location deactivation, warehouse assignment, and payment (which is financial truth).
- **One UoW per write, atomic effects via `Api(tx)`** (0002): `completeOrder`, `completeProduction`, receiving, transfer, void.
- **`recordMovement` is the sole writer of stock balances** (0011); every stock change is an immutable movement.
- **Money/Qty end-to-end, rounded once at the boundary** (0003); no `Number(string)`.
- **Fixes the live defects:** P0 fire-and-forget deduction (0013), unenforced RBAC (0004), unreliable audit (0005), money precision (0003).

The prior AI-generated redesign is archived (superseded) at [`docs/_archive/server-redesign/`](../_archive/README.md).
