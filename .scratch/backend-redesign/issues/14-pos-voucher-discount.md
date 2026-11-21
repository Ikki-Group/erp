# 14: POS voucher & discount

**What to build:** Voucher codes that can be validated and applied to an order, and line/order discounts computed safely — the promotion inputs the order-totals calculator uses.

**Blocked by:** 06.

**Status:** ready-for-agent

- [ ] Voucher CRUD (`handle*`, RBAC `voucher.manage`); validate on apply (active, not expired, meets minimum); one voucher per order invariant (ADR-0013).
- [ ] `voucher.increment(id, tx)` exposed as an atomic `Api(tx)` effect for order completion; reversible on void (ADR-0002, 0013).
- [ ] Discount calculator (pure Money): line- and order-level, percentage or fixed, clamped so totals never go negative (`assertNoNegativeTotal`) (ADR-0003, 0013).
- [ ] Order-totals calculator (pure): lineTotal / subtotal / taxable / tax (rate from CompanyApi) / total, full precision, rounded at boundary (ADR-0003, 0008, 0013).
- [ ] Unit tests (discount clamping, totals incl. tax, voucher validation); `verify` + `test` pass.
