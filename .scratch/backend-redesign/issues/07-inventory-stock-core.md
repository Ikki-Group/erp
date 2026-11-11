# 07: Inventory stock core (recordMovement)

**What to build:** The single code path through which all stock changes flow — `recordMovement` — writing an immutable ledger and the derived balance, applying the permissive/cost/assignment rules in one place. This is the cross-module `Api(tx)` effect POS and production call.

**Blocked by:** 05.

**Status:** ready-for-agent

- [ ] `recordMovement(input, tx)` is the sole writer of `stock_balances`: checks assignment (except permissive sale), computes weighted-average cost (ticket 05), upserts balance, inserts an immutable movement (ADR-0011).
- [ ] Movement types supported: purchase_receipt, transfer_in/out, adjustment_in/out, sales, return_in, production_in/out; cost changes only on inbound cost events (ADR-0011, 0010).
- [ ] Permissive rules: sale/production/void-reversal never block (may go negative); manual adjustment unrestricted; exposed as `Api(tx)` (deductForOrder etc.) (ADR-0006, 0011).
- [ ] `SELECT ... FOR UPDATE` on the balance during deduction for consistent cost updates (ADR-0006).
- [ ] Balance/movement read queries; min-stock alert as a cross-location sum emitted as a non-critical event (ADR-0011).
- [ ] `StockMovementRecorded` post-commit event emitted (journal hook; no subscriber yet) (ADR-0011).
- [ ] Unit tests (permissive deduction, cost on inbound) + integration proving balance+movement move together and negative balance is allowed; `verify` + `test` pass.
