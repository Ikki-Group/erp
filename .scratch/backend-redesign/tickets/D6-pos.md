# D6 · POS domain (order lifecycle, split bill, void, shift, table, discount/voucher)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: D4 D5

## Question

The highest-complexity module. Press: order lifecycle (open/close bill), line sync, split bill (payment-level vs the described but unmodeled item-level split — resolve the gap), full/partial void with stock reversal + journal reversal, cashier shift (one-open invariant, cash reconciliation), table (move/merge, one-open-order invariant), discount + voucher. Wire the atomic complete-order use-case per ADR-0002 (deduct stock via inventory `Api(tx)`, permissive per ADR-0006).

## Notes

- Raw material: `docs/product/05-prd-pos.md`, `10-workflows.md`. Existing: `pos/{order,shift,table,voucher}` — carries the live P0 (fire-and-forget deduction) and P1 (no RBAC on routes).
- Known design gap: split "by items" described but data model is payment-level only.
- Depends on D4 (menu/recipe) and D5 (inventory deduct effect).
- Moka import: Order model must carry `source`/`externalRef`, but import pipeline is out of scope (MAP).

## Review flags (from foundation-ADR review, 2026-09-13)

- **[FLAG #1] Void reversal permissive** — completing an order never blocks on stock (ADR-0006); voiding it (adding stock back) must likewise never fail on quantity. See D5 FLAG #1.
- **[FLAG #5] Journal event hook** — order complete/void is a journal trigger (ADR-0002 §2). Emit a domain event for Finance to subscribe later; do not wire Finance now. See D5 FLAG #5.
- Blocked-by now also implicitly assumes D0 (auth/iam) via D4/D5 → D1 → D0 chain (shift/order actor + location come from the session resolved in D0).
