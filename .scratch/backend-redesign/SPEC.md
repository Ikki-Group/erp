# Spec: Ikki ERP Backend Redesign (Foundation + Core Operations)

`ready-for-agent` · local tracker · synthesized 2026-09-13 from ADR-0001…0014 + `CONTEXT.md`

> This spec collapses the grilled wayfinder decisions into one buildable plan. The ADRs (`docs/adr/`) are the normative source; this spec is the handoff into `/to-tickets`. Domain vocabulary: root `CONTEXT.md`.

## Problem Statement

The Ikki ERP backend was built from AI-generated PRDs that were never human-tested, and its documented standard drifted from the code. Concretely, the operations layer carries live defects: completing a POS order marks it done and *then* deducts stock fire-and-forget (a deduction failure silently corrupts stock — a P0); POS/inventory routes authenticate but never authorize; audit is fire-and-forget with an empty actor name; money round-trips through `Number(string)` and loses precision. The team cannot trust the foundation, and no single answer exists to "is a module built correctly?"

## Solution

A re-established, battle-tested backend built on 14 grilled ADRs. Every module follows one canonical shape (flat-hybrid with pure-domain separation). Every write runs in one Unit of Work; cross-module effects that must be atomic (stock deduction, voucher, audit) run inside it via a neighbour's `Api(tx)`, while non-critical effects (table status, min-stock, journals) fire as post-commit events. Money is a value object end-to-end. RBAC is enforced on every route. The system is deliberately **permissive and non-blocking** for a small UMKM: a sale never blocks on stock (negative stock is a restock signal), while genuinely destructive or physically-impossible actions (transfer-out, location deactivation) still check. The result fixes the P0/P1/P2 defects structurally and gives GPT-Luna a mechanical standard to build the remaining operations modules against.

## User Stories

### Auth, IAM & access (ADR-0004, 0007)
1. As a user, I want to log in and receive a session, so that I can use the system.
2. As a user, I want `GET /me` to return my full access map (all locations I can reach + my permissions per location), so that the frontend can switch location without calling the server.
3. As a cashier, I want to switch my active location instantly in the UI, so that I don't wait on a round-trip.
4. As the system, I want every request to carry its target location and be validated against the user's access map, so that authorization is enforced per request.
5. As an owner, I want to bypass all permission checks, so that I always have full access.
6. As an admin, I want a user to hold different roles at different locations, so that access matches responsibility.
7. As the system, I want role/assignment changes to invalidate the affected access-map caches (per-user directly, per-role by tag), so that permission changes take effect without stale reads.
8. As the system, I want the per-request auth path to hit zero DB calls (cache only), so that Neon round-trips are minimized.

### Core: Location, Company, Numbering (ADR-0008)
9. As an owner, I want locations typed as store or warehouse, so that capability follows type (POS/menu only at stores).
10. As the system, I want to reject creating an order or a menu item at a warehouse, so that data cannot be corrupted via direct API calls.
11. As an admin, I want deactivating a location with stock to be blocked, so that stock history is never orphaned.
12. As any actor, I want documents numbered `PREFIX-LOCATION-YYYYMMDD-SEQ` with a daily per-location reset in Asia/Jakarta time, so that numbers are meaningful and unique.
13. As the system, I want the sequence produced by one atomic upsert inside the operation's transaction, so that there are no races and no gaps on rollback.
14. As an owner, I want a single company-wide tax rate in Company settings that POS consumes, so that tax is configured in one place.

### Master Data: Material, UoM, Supplier (ADR-0009)
15. As an admin, I want a global material catalog shared across locations, so that transfer between locations is easy.
16. As an admin, I want to assign materials to locations, so that each location only sees what's relevant.
17. As the system, I want receiving/transfer of an unassigned material to be rejected, so that warehouse data stays clean.
18. As a cashier, I want a sale to proceed even if a recipe material isn't assigned at my store, so that a setup gap never blocks a sale (it records anomalously instead).
19. As an admin, I want multi-hop UoM conversion (karton→L→ml) resolved automatically, so that I can enter quantities in convenient units.
20. As an admin, I want a material to have a base UoM plus optional default purchase/stock/recipe UoMs, so that forms pre-fill sensibly.
21. As a buyer, I want suppliers with reference prices per material, so that I have purchasing context (actual PO price may differ).

### Costing & HPP (ADR-0010)
22. As an owner, I want per-location weighted-average cost, so that each store's real cost is reflected.
23. As the system, I want receiving to recalculate weighted-average cost, so that cost tracks purchases.
24. As the system, I want cost to reset to the incoming unit cost when on-hand is ≤ 0, so that a negative balance never produces nonsensical cost.
25. As an owner, I want HPP per menu item computed from the location's cost across the recipe, so that margin is visible per store.
26. As the system, I want HPP to use the last known cost when stock is negative (0 when a material has no cost history yet), so that HPP is always computable.
27. As the system, I want a transfer to carry the source's cost to the destination's weighted average, so that transferred stock is costed correctly.

### Menu & Recipe (ADR-0012)
28. As a store manager, I want a per-location menu of items with categories, so that Coffee and Resto sell different things.
29. As a store manager, I want modifier groups/options that adjust price, so that customers can customize orders.
30. As the system, I want modifiers to affect price but not stock in Phase 1, so that deduction stays simple (base recipe only).
31. As a store manager, I want exactly one active recipe (BOM) per menu item, so that deduction and HPP are unambiguous.
32. As the system, I want an order line to snapshot prices at transaction time, so that later menu price changes never alter historical orders.
33. As the system, I want deleting a material used by an active recipe to be blocked, so that recipes stay valid.

### Inventory (ADR-0011)
34. As the system, I want every stock change to go through one `recordMovement`, so that all stock rules live in one place.
35. As warehouse staff, I want an immutable movement ledger, so that every change is auditable.
36. As warehouse staff, I want to receive goods (purchase UoM → base UoM, cost recalculated), so that stock and cost update together.
37. As a store manager, I want to request a transfer, and warehouse staff to ship it (stock leaves source) and me to receive it (stock arrives), so that inter-location movement is tracked.
38. As the system, I want transfer-out to require sufficient stock, so that I don't ship goods that don't exist.
39. As a manager, I want a snapshot-based opname that lets sales continue while counting, so that reconciliation never halts the store.
40. As the system, I want opname completion to create adjustment movements for variances, so that the balance is corrected.
41. As a manager, I want a min-stock alert summed across all locations, delivered as a non-blocking signal, so that I know when to restock.

### POS (ADR-0013)
42. As a cashier, I want to open an order (open bill) or ring up and pay in one action (close bill), so that both service styles work.
43. As a cashier, I want to add/sync line items with modifiers on an open order, so that I can build the bill over time.
44. As a cashier, I want to record one or more payments (split by payment), so that customers can pay by mixed methods.
45. As the system, I want an order to complete only when payments ≥ total, so that revenue is never understated.
46. As the system, I want completing an order to deduct stock inside the same transaction (permissively) and increment voucher usage atomically, so that the P0 fire-and-forget bug is structurally impossible.
47. As a cashier, I want completing an order with insufficient stock to still succeed (stock goes negative), so that I'm never blocked mid-service.
48. As a cashier, I want to void a full order or a single line, reversing stock (if completed) and voucher usage, so that mistakes are correctable.
49. As the system, I want a voided paid order to record the void + reason and emit a journal hook, so that Finance can reconcile later (no in-app refund in Phase 1).
50. As a cashier, I want to open and close a shift with cash reconciliation (expected vs actual), so that the drawer is accountable.
51. As the system, I want at most one open shift per cashier per location and every order tied to an open shift, so that sales are attributed correctly.
52. As a manager, I want `shift.close-other`, so that I can close a shift a cashier left open.
53. As a waiter, I want to link an order to a table and move it between tables, so that dine-in seating is tracked (merge is backlogged).
54. As a cashier, I want line- and order-level discounts and one voucher per order, clamped so totals never go negative, so that promotions apply safely.
55. As the system, I want an order to carry `source`/`externalRef`, so that Moka-imported orders can be deduplicated later (import pipeline out of scope).

### Production (ADR-0014)
56. As a store, I want semi-finished materials produced internally (e.g. Gula Cair), tracked like any material, so that in-house prep is inventoried.
57. As production staff, I want a production order that consumes inputs and produces an output atomically, so that stock and cost update together.
58. As the system, I want production consume to be permissive (like a sale), so that staff are never blocked by imperfect input stock.
59. As the system, I want the output's cost derived from the inputs consumed, so that the semi-finished cost is accurate.

### Cross-cutting: audit, transactions (ADR-0002, 0005)
60. As an owner, I want every mutation audited atomically with a non-empty actor name, so that the trail is complete and trustworthy.
61. As the system, I want audit action verbs (void, complete, ship…) to match permission verbs, so that the log reads meaningfully.
62. As the system, I want one audit entry per user action (derived effects traced by their movement), so that the log isn't noisy.

## Implementation Decisions

- **Module standard (ADR-0001):** flat-hybrid — `<x>.contract.ts` / `.repo.ts` (`IXxxRepo`+`XxxRepo`) / `.rules.ts` / `.calculator.ts` (when money/qty math) / `.service.ts` (`XxxService` with `handle*`) / `.route.ts` / `.internal.ts` / `.module.ts` / `index.ts`. Simple = flat; complex = sub-folder per sub-entity. Pure logic in rules/calculator (DB-free); orchestration in service. Infra from `ctx`; cross-module via static `Api` only; barrel exports only `ModuleDescriptor` + `Api`.
- **Transactions (ADR-0002):** one write = one UoW at the top-most `handle*`; atomic cross-module effects via `Api` methods that accept `tx`; no nested transactions; no error-swallowing inside a UoW; mandatory ordering (load→rules→compute→persist→atomic effects→audit; post-commit: events→cache).
- **Money (ADR-0003):** `Money`/`Qty` value objects only; amount 0dp, cost 4dp, qty 6dp, HALF_UP; full precision through calc, round once at boundary; serialize as numeric string. Add `Money.toAmount()`/`toCost()`; retire raw-Decimal helpers; refactor UoM resolver to `Qty`.
- **RBAC (ADR-0004):** permission `<slice>.<action>` (dot); domain verbs first-class; enforced by the `rbac` macro on every route; owner bypass; catalog + 5 roles adopted, rewritten, in-scope only.
- **Audit (ADR-0005):** atomic in the UoW; `actorName` mandatory from `Actor`; action verbs match RBAC; one entry per user action.
- **Concurrency/permissive stock (ADR-0006):** drop `stock_balances_qty_nonneg_chk`; sales/production/void never block; transfer-out/deactivation still check; opname snapshot-based; one-active invariants via partial unique index; `SELECT ... FOR UPDATE` on deduction.
- **Auth/IAM (ADR-0007):** `SessionStore` port (memory now); location from request header validated per request; per-user access map cached (`auth:access:{userId}`), invalidated per-user + by-tag `role:{roleId}`; zero-DB per-request auth path; one joined query on cache miss.
- **Core (ADR-0008):** location `type` capability enforced server-side; deactivation blocked on stock; numbering via atomic upsert on `document_sequences` inside the UoW (Asia/Jakarta); Company singleton, single tax rate via `CompanyApi`.
- **Master data (ADR-0009):** global material catalog; assignment hard-constraint for receiving/transfer, permissive for sale; UoM resolver a pure `Qty` calculator (BFS retained); cost per-location, not on material.
- **Costing (ADR-0010):** weighted average, reset to incoming cost when on-hand ≤ 0; `cost_price` changes only on inbound; HPP from last known cost; ordered atomic transfer cost flow.
- **Inventory (ADR-0011):** `recordMovement` sole balance writer; movement types incl. `production_in`/`out`; void reversal `return_in` (permissive, cost-neutral); `StockMovementRecorded` post-commit event (journal hook, no subscriber yet); transfer = ship + receive (two UoWs).
- **Menu/recipe (ADR-0012):** per-location, one active recipe per item, modifiers price-only, enriched `itemDetail` via `Api`, order-line price snapshot.
- **POS (ADR-0013):** `completeOrder` one atomic UoW (deduct via `inventoryApi.deductForOrder(tx)`, voucher increment, audit); split payment-level; full/partial void each one UoW; shift one-open + order requires shift; table move (merge backlogged); totals via clamped Money calculator.
- **Production (ADR-0014):** `completeProduction` one UoW via `recordMovement`; consume permissive; output cost from inputs.
- **Schema changes:** drop non-negative CHECK on `stock_balances`; add `production_in`/`production_out` to movement types; ensure partial unique indexes for one-open shift, one-active opname, one-open order per table; `document_sequences` upsert.

## Testing Decisions

- **What makes a good test:** exercise external behavior through the module's seam, not implementation details. The seam is the module's `Api` / `handle*` methods (ADR-0001 §6). Never test past the interface into repo internals.
- **Unit tests (no DB):** every `*.calculator.ts` and non-empty `*.rules.ts` — totals, weighted-average cost (including on-hand ≤ 0 and negative inputs), UoM chain resolution, discount clamping, expected-cash, fully-paid, capability asserts.
- **Integration tests (real DB, through `handle*`):** one per write use-case proving atomicity — most importantly that a failure inside `completeOrder`/`completeProduction`/transfer rolls back the whole operation, and that permissive deduction drives stock negative without failing. Prove `recordMovement` is the only balance writer by asserting balance + movement move together.
- **Prior art:** existing tests live in `apps/server/src/tests/`; `location` is the reference simple module; follow AGENTS.md (`bun test`, `NODE_ENV=test`).

## Out of Scope

- **Finance** (CoA, journals, AP/AR, fiscal period, reports) — but journal event hooks (`StockMovementRecorded`, void/complete hooks) are emitted now so Finance attaches later without re-opening modules.
- **HR** (employees, shifts, attendance, payroll) and **CRM** (customers, loyalty, promotions).
- **Moka import pipeline** — the Order model accommodates `source`/`externalRef`, but import itself is deferred.
- **Item-level split bill, table merge, in-app financial refund, modifier→recipe override** — all Phase-1 backlog.
- **Redis session / cache** — memory adapters now, behind ports for a later swap.

## Further Notes

- The AI-generated PRDs (`docs/product/`) are raw input that was pressed, not copied; several claims were consciously overridden and recorded in the ADRs (audit async → atomic; production "rejected on zero stock" → permissive; split "by items" → payment-level; permission colon-format → dot-format).
- Non-conforming existing code to fix during migration: `menu.module.ts` (global-cache import + duck-typing), the raw-Decimal `shared/utils/money.ts` path, and all POS/inventory routes lacking a `permission`.
- Executor is GPT-Luna: the module standard is mechanical by design so each module is a copy of `location` (simple) or `menu`/`iam` (complex).
- Suggested ticket order mirrors the domain dependency chain: auth/iam → core → master-data → costing → menu/recipe → inventory → pos → production.
