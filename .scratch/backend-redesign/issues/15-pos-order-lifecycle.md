# 15: POS order lifecycle (the P0 fix)

**What to build:** The full POS order flow — open/close bill, add/sync lines, record payments (split), complete, and void — where **completing an order atomically deducts stock inside one transaction**, structurally eliminating the live P0 (fire-and-forget deduction). This is the capstone: every other module feeds into it.

**Blocked by:** 06, 07, 12, 13, 14.

**Status:** ready-for-agent

- [ ] Order create (open or close bill) requires an active shift (ticket 12); links a table if dine-in (ticket 13); carries `source`/`externalRef` for future Moka dedup (ADR-0013).
- [ ] Line sync builds lines from the menu `itemDetail` (ticket 06) with **price snapshot** (base + modifier adjustments + names) at transaction time (ADR-0012, 0013).
- [ ] Payments: one or more records (split payment-level); order completes only when `sum(payments) ≥ total`; overpayment recorded (ADR-0013).
- [ ] **completeOrder (one UoW, mandatory ordering):** load → assertOpen → assertFullyPaid → mark completed → `inventoryApi.deductForOrder(order, lines, actor, tx)` (permissive; low stock never fails, in-tx) → `voucherApi.increment(tx)` → audit; post-commit: table→available event, `StockMovementRecorded`/journal hook, cache invalidate. No fire-and-forget (ADR-0002, 0006, 0011, 0013).
- [ ] Void full (one UoW, all lines) / partial (one UoW, one line): reverse stock via `return_in` (permissive, cost-neutral) and voucher usage if completed; open orders touch no stock; refund recorded (audit + journal hook), no in-app refund mechanism (ADR-0011, 0013).
- [ ] Totals via the ticket-14 calculator; every route declares a `permission` (closes the P1); every mutation audited with actor name (ADR-0004, 0005).
- [ ] Integration tests: completeOrder deducts stock in the same transaction; a forced in-tx error rolls back completion; sale with insufficient stock still completes (stock negative); void reverses stock; `verify` + `test` pass.
