# 05: Costing (weighted average, HPP)

**What to build:** Per-location weighted-average cost that stays sensible even when stock is negative, and an HPP calculation for menu items — the cost engine inventory and POS rely on.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Weighted-average cost calculator (pure, over Money/Qty): full formula when on-hand > 0; resets to incoming unit cost when on-hand ≤ 0 (ADR-0010).
- [ ] `cost_price` lives per-location on `stock_balances`; changes only on inbound events; holds last known cost when quantity negative (ADR-0010).
- [ ] HPP calculator: location cost × recipe usage (converted via pure resolver) ÷ yield; uses last known cost when negative; 0 when a material has no cost history (accepted, surfaced) (ADR-0010).
- [ ] Transfer cost flow rule defined (source cost captured out, applied in at destination) for use by ticket 09.
- [ ] Unit tests covering on-hand ≤ 0, negative inputs, zero-cost material; `verify` + `test` pass.
