# ADR-0006: Concurrency & Permissive-Stock Model

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0002 (transaction model). **Revises:** one point of ADR-0002 (see §2).

## Context

Ikki is a small F&B business (2 stores + warehouses, a handful of cashiers), so real contention is low. The owner set a clear guiding principle: **the app must be smart and non-blocking — it must not demand stock discipline from users or get in the way of a transaction.** The focus is a small UMKM, not a high-concurrency enterprise system.

The PRDs make several concurrency claims (opname blocks all movements at a location; one open shift per cashier; one open order per table; stock cannot go negative). The current schema enforces some of these at the DB level, including `stock_balances_qty_nonneg_chk: CHECK (quantity >= 0)`. That constraint directly conflicts with the non-blocking principle: it rejects a sale that would drive stock negative — exactly the blocking behaviour to avoid.

## Decision

### 1. Negative stock is allowed for sales (permissive)

- **Drop** the `stock_balances_qty_nonneg_chk` CHECK constraint.
- A POS sale (recipe deduction on order complete) **never fails** because stock is insufficient. The order completes; the balance may go negative.
- Negative stock is a **signal**, not an error: it surfaces on the dashboard / alerts as "needs restock or opname". The business decides; the app does not block the cashier.

### 2. Revision of ADR-0002: sale deduction does not roll back on low stock

- ADR-0002 §4 stated a failing atomic effect throws `insufficientStock` (→409) and rolls back. **For sale/recipe stock deduction this no longer applies** — deduction cannot fail on insufficiency; it proceeds and may go negative.
- The atomic-effect rule of ADR-0002 still holds for **transfer-out** (see §3) and for genuine errors (material not found, DB failure): those still throw and roll back.

### 3. Transfer-out still requires sufficient stock

- Shipping a transfer still checks the source has enough stock. Sending physical goods that do not exist is a **data error**, not a "don't nag the user" case — it throws and rolls back.
- Manual adjustments are unrestricted (their purpose is correction, in either direction).

| Operation | Insufficient stock behaviour |
| --- | --- |
| Sale (recipe deduction) | Allowed to go negative; never blocks |
| Void reversal (add stock back) | Never blocks — adding stock cannot fail on quantity |
| Transfer-out (ship) | Rejected — must have enough |
| Manual adjustment | Unrestricted (correction) |

### 4. Opname is snapshot-based and non-blocking

- Starting an opname captures each material's `systemQty` at that moment (a snapshot).
- Sales and other movements **continue during the opname** — nothing is blocked.
- On completion, variance is computed against the snapshot, and adjustment movements are created for the difference.
- This replaces the PRD's "block all movements at the location while in_progress" — that would block cashiers, violating the principle.

### 5. "One active" invariants via partial unique index (not locks)

- Enforced declaratively at the DB, following the existing `recipes_menu_item_active_uniq` partial-index pattern:
  - one open shift per cashier per location,
  - one active opname per location,
  - one open order per table (exact shape resolved when the POS module is grilled, since order status lives on the order row).
- These prevent **impossible state** (two simultaneous open shifts), which is a bug, not normal operation — so they are not "blocking the user". Opening a second shift while one is open is correctly rejected.

### 6. Concurrent deduction safety

- Stock deduction inside a UoW reads the balance with `SELECT ... FOR UPDATE` (row lock) then writes.
- With negative stock now legal, a concurrent-deduction race is no longer a correctness hazard (the worst case is a negative balance, which is an accepted signal). The row lock keeps the weighted-average-cost update consistent.

## Alternatives Considered

- **Keep `CHECK (quantity >= 0)` and reject sales that would go negative.** Rejected: blocks the cashier — the exact behaviour the owner ruled out.
- **Lock the whole location during opname.** Rejected: blocks operations; snapshot-based opname achieves reconciliation without blocking.
- **Enforce "one active" via application assertions only.** Rejected: a race can slip two rows past an assertion; a partial unique index cannot be raced.

## Consequences

- **Easier:** cashiers are never blocked by stock; opname doesn't halt the store; the model fits a small UMKM.
- **Harder:** negative stock must be handled gracefully everywhere it's read (reports, HPP, alerts) — a negative balance is valid data. HPP on negative stock uses the last known cost.
- **Constraint:** drop the non-negative CHECK; sale deduction never blocks; transfer-out still checks; opname is snapshot-based; "one active" rules are partial unique indexes. A DB migration removes the CHECK constraint.
