# ADR-0013: POS Domain (order lifecycle, payments, void, shift, table, discount/voucher)

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0002 (atomic effects/UoW ordering), ADR-0003 (Money), ADR-0006 (permissive stock), ADR-0008 (store-only, tax rate), ADR-0011 (deduction/void via recordMovement), ADR-0012 (menu prices/snapshot).
**Reviews:** the AI-generated `docs/product/05-prd-pos.md` and `10-workflows.md`. **Closes:** the live P0 (fire-and-forget stock deduction) and the split-bill design gap.

## Context

POS is the highest-complexity module (sub-entities: order, shift, table, voucher), store-only. It holds the live P0: completing an order marked it completed, committed, then deducted stock fire-and-forget with errors swallowed. It also carries a design gap: split "by items" is described but the data model is payment-level only.

## Decision

### 1. `completeOrder` is one atomic use-case (closes the P0)

Inside one UoW, following the mandatory ordering (ADR-0002 §6):
1. load order; `assertOrderOpen`
2. `assertFullyPaid` (§2)
3. mark completed
4. **deduct stock via `inventoryApi.deductForOrder(order, lines, actor, tx)`** — permissive (ADR-0006/0011), so low stock never fails completion, but it runs **inside** the transaction (a real error like DB failure rolls back)
5. increment voucher usage via `voucherApi.increment(id, tx)` (atomic)
6. audit (in tx)

After commit: publish events (table→available, `StockMovementRecorded` journal hook), invalidate cache. Deduction is never fire-and-forget again.

> **Why payment blocks but stock does not:** step 2 (fully-paid) is a hard invariant while step 4 (stock) is permissive — deliberately, not inconsistently. Payment is financial truth: completing an unpaid order would misstate revenue. Stock is a record that can be corrected (a negative balance is a restock signal, ADR-0006). So the money side blocks; the stock side never does.

### 2. When an order may complete

- `assertFullyPaid`: `sum(payments) ≥ total` (pure rule over Money, ADR-0003). Total = 0 may complete directly. Overpayment (cash change) is recorded; the order still completes once ≥ total.

### 3. Split bill: payment-level only in Phase 1 (closes the gap)

- Split = **multiple payment records on one order** (different methods/amounts). This is the model and covers the common cases (shared bill, mixed cash+QRIS).
- **Item-level split** (allocating lines to different payers) is **backlogged** — it needs a payment↔line mapping not worth the complexity for a small UMKM. Per-item allocation is a cashier/UI concern, not a Phase-1 backend model.

### 4. Void (full and partial)

- **Full void** is **one UoW** covering the whole order: if the order is `completed`, reverse the stock of **all** its lines via `return_in` (permissive, cost-neutral, ADR-0011) and reverse voucher usage; set `voided`; audit — all in a single transaction. If the order is still `open`, void touches no stock (nothing was deducted). Post-commit events: journal-reversal hook, table→available.
- **Partial void** is **one UoW** covering a single line: set the line `voided`, recalculate order totals (pure calculator), and reverse that one line's stock only if the order was already completed.
- Both are single atomic operations; neither loops per-line across multiple transactions.
- **Refund:** a voided paid order records the void + reason in audit and emits the journal hook; **no financial refund mechanism is built in Phase 1** (Finance out of scope). Actual cash refund is handled outside the system for now.

### 5. Cashier shift

- One open shift per cashier per location (partial unique index, ADR-0006). Every order **requires an active shift** — creating an order with no open shift is rejected (an invariant, not nagging: the cashier opens a shift first).
- Close computes `expectedCash = openingCash + cash payments − cash refunds` (pure calculator over Money); variance is recorded for accountability. `shift.close-other` (ADR-0004) closes another user's shift.

### 6. Table

- Status (`available`/`occupied`/`reserved`) changes via **event** (non-critical, ADR-0002 — a wrong status is manually correctable). One open order per table (partial unique, ADR-0006).
- **Move** (reassign an order to another table; old→available, new→occupied) is Phase 1. **Merge** (combining two tables' orders into one bill) is **backlogged** — rare and complex; move covers the common need.

### 7. Discount & voucher

- Discounts (line- and order-level, percentage or fixed) are computed in a pure calculator over Money, clamped so totals never go negative (`assertNoNegativeTotal`).
- Totals calculator (full precision, rounded once at the boundary, ADR-0003):
  `lineTotal = qty × (basePrice + modifierTotal) − lineDiscount`;
  `subtotal = Σ lineTotal`;
  `taxable = subtotal − orderDiscount`;
  `tax = taxable × taxRate` (rate from `CompanyApi`, ADR-0008);
  `total = taxable + tax`.
- One voucher per order (invariant); validate on apply (active, not expired, meets minimum). `voucher.increment(id, tx)` on complete is an atomic effect; voiding a completed order reverses it (§4).
- Order lines snapshot prices at transaction time (ADR-0012) — later menu price changes never alter historical orders.

## Alternatives Considered

- **Keep deduction after commit (status quo).** Rejected: the P0 — silent stock corruption.
- **Block completion on insufficient stock.** Rejected: violates permissive stock (ADR-0006); deduction runs in-tx but never fails on low stock.
- **Item-level split now.** Rejected: large model cost for a rare UMKM case; payment-level covers it.
- **Merge tables in Phase 1.** Rejected: rare and complex; move suffices.

## Consequences

- **Easier:** completion is atomic and readable; the P0 is structurally impossible; split/void/shift/table follow the established rules.
- **Harder:** completion coordinates several atomic effects in one UoW; refund and item-split are deferred (accepted).
- **Constraint:** `completeOrder` deducts stock inside the UoW via `Api(tx)`; split is payment-level; order requires an active shift; table/journal effects are post-commit events; totals via a pure Money calculator clamped non-negative.
