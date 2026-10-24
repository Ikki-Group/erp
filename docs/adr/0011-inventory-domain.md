# ADR-0011: Inventory Domain (stock ledger, transfer, opname, receiving)

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0002 (transactions/events), ADR-0006 (permissive stock), ADR-0009 (assignment), ADR-0010 (costing).
**Reviews:** the AI-generated `docs/product/06-prd-inventory.md`. **Closes:** D5 FLAG #1 (void reversal permissive), D5 FLAG #5 (journal event hook).

## Context

Inventory owns stock balances (one per material per location) and an immutable movement ledger, plus transfer, opname, receiving, and min-stock alerts. It also exposes the atomic `deductForOrder(...tx)` effect that POS (D6) depends on. Two review flags land here: void reversal must be permissive, and a journal hook must exist so Finance can attach later without re-opening finished modules.

## Decision

### 1. `recordMovement` is the only writer of `stock_balances`

- Every stock change — sale, receiving, transfer in/out, adjustment, opname, void reversal — goes through one `recordMovement(input, tx)`. It: checks assignment (except permissive POS sale, ADR-0009), computes weighted-average cost (ADR-0010), upserts the balance, and inserts an immutable movement row.
- Nothing else touches `stock_balances`. This concentrates the permissive/cost/assignment rules in one place (locality, ADR-0001) and is the cross-module `Api(tx)` effect other modules call (POS deduction, receiving, etc.).
- Movement types: `purchase_receipt`, `transfer_in`, `transfer_out`, `adjustment_in`, `adjustment_out`, `sales`, `return_in`, `production_in`, `production_out` (the last two added by ADR-0014). Each carries `type`, `direction`, quantity, `cost_price` at the time, and `referenceType`/`referenceId`.

### 2. Void reversal is permissive (closes FLAG #1)

- Voiding a completed order reverses stock via a `return_in` movement (direction in) through `recordMovement`.
- Adding stock back **never fails** (permissive, ADR-0006) — e.g. −3 → +2 is fine.
- `return_in` does **not** change `cost_price` (ADR-0010: only inbound purchase/transfer change cost; a return restores quantity only).

### 3. Journal event hook (closes FLAG #5)

- Every movement-producing use-case publishes a `StockMovementRecorded` domain event **after commit** (ADR-0002 non-critical event), carrying enough for a journal: material, location, qty, cost, type, referenceType/Id.
- There is **no subscriber now** — a safe no-op. When Finance is built it subscribes to this event, with no change to inventory. The hook exists from day one so finished modules are never re-opened.

### 4. Transfer is two separate write operations

Transfer moves stock at two different times, so it is **not** one atomic operation — it is two, each in its own UoW:

- **Ship** (`requested → in_transit`): check the source has sufficient stock (transfer-out is checked, ADR-0006), record `transfer_out` carrying the source `cost_price` (ADR-0010), reduce source stock.
- **Receive** (`in_transit → received`): record `transfer_in` using `source_cost`, add destination stock (permissive — never fails).
- Between ship and receive, the goods are "in transit": already out of the source, not yet in the destination — present in no balance, which correctly models goods on the road. `cancelled` is only reachable from `requested` (before any stock moved).

### 5. Opname is snapshot-based; min-stock via event

- Opname captures `systemQty` per material at start, lets sales continue (ADR-0006), and on completion creates `adjustment_in`/`adjustment_out` movements for each variance (through `recordMovement`; adjustments don't change cost, ADR-0010). One active opname per location (partial unique index, ADR-0006).
- Min-stock alerts sum quantity across all locations and fire as a non-critical event (ADR-0002), not a blocking check.

### 6. Receiving

- Converts purchase-UoM quantity/cost to base UoM (pure resolver, ADR-0009), records `purchase_receipt` (recalculates weighted-average cost, ADR-0010), and requires the material to be assigned at the receiving location (ADR-0009). Emits `StockMovementRecorded` for the future AP/journal.

## Alternatives Considered

- **Multiple writers of `stock_balances`.** Rejected: scatters the permissive/cost/assignment rules; one writer keeps them local and testable.
- **Transfer as one atomic operation.** Rejected: shipment and receipt happen at different times; forcing one transaction mismodels goods in transit.
- **Block on min-stock / opname.** Rejected: violates the non-blocking principle (ADR-0006).

## Consequences

- **Easier:** one code path for all stock changes; void never blocks; Finance attaches by subscribing to one event; transfer models reality.
- **Harder:** every stock operation must route through `recordMovement`; the `StockMovementRecorded` event must carry complete journal data even though nothing consumes it yet.
- **Constraint:** `recordMovement` is the sole balance writer; void reversal is permissive and cost-neutral; movement use-cases emit `StockMovementRecorded`; transfer is ship + receive in two UoWs.
