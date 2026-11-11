# 10: Inventory opname

**What to build:** A manager runs a physical count that snapshots system quantities at start, lets sales continue while counting, and on completion creates adjustment movements for any variance — reconciliation without halting the store.

**Blocked by:** 07.

**Status:** ready-for-agent

- [ ] Opname CRUD (`handle*`, RBAC): header (location, status) + lines (material, systemQty snapshot, actualQty); one active opname per location (partial unique) (ADR-0006, 0011).
- [ ] Start captures `systemQty` snapshot; sales and other movements continue during the opname (no blocking) (ADR-0006).
- [ ] Complete (one UoW): for each variance, `recordMovement(adjustment_in/out)` (cost-neutral); balances corrected (ADR-0010, 0011).
- [ ] Integration test: sales during opname don't corrupt reconciliation; completion adjusts to actual; `verify` + `test` pass.
