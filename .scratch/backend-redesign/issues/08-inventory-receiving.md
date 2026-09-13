# 08: Inventory receiving

**What to build:** Warehouse or store staff record goods arriving from a supplier; stock and weighted-average cost update together, and a journal hook fires for later Finance.

**Blocked by:** 07.

**Status:** ready-for-agent

- [ ] Receiving CRUD (`handle*`, RBAC `receiving.create`): header + lines (material, qty in purchase UoM, unit cost, UoM) (ADR-0011).
- [ ] On save (one UoW): convert purchase UoM → base UoM via the pure resolver; `recordMovement(purchase_receipt)` which recalculates weighted-average cost; require the material assigned at the receiving location (ADR-0009, 0010, 0011).
- [ ] Emits `StockMovementRecorded` for future AP/journal (ADR-0011).
- [ ] Integration test: receiving raises balance and updates cost atomically; unassigned material rejected; `verify` + `test` pass.
