# D3 · Costing domain (per-location weighted average, transfer cost flow, HPP)

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: D2 ✅

## Resolution (2026-09-13)

**Decision:** Weighted average resets to incoming cost when on-hand ≤ 0 (closes FLAG #2); cost_price changes only on inbound events and holds last known cost; HPP uses last known cost; transfer cost flow is an ordered atomic sequence. Full decision in [`docs/adr/0010-costing-domain.md`](../../../docs/adr/0010-costing-domain.md).

Settled Q1–Q3:
- Q1 [FLAG #2 closed]: oldQty > 0 → full weighted avg; oldQty ≤ 0 → newCost = incoming unit cost (reset). Avoids negative/nonsensical cost.
- Q2: HPP uses last known cost_price; cost_price never changed by sale/void/adjustment/opname — only inbound.
- Q3: transfer cost flow ordered in one UoW — read source cost → transfer_out carries it + reduce source (still checks stock) → destination weighted-avg with source_cost (permissive add).

## Question

Press: per-location weighted-average cost on `stock_balances.cost_price`; recalculation triggers (receiving + transfer received); transfer cost flow (source cost captured on transfer-out, flows to destination); HPP = location cost × recipe usage. Does this hold under permissive stock (ADR-0006) — what is HPP/cost when stock is negative?

## Notes

- Raw material: `docs/product/03-prd-master-data-costing.md`. Existing: `shared/domain/costing.ts` (weightedAvgCost over Money/Qty, per ADR-0003).
- Tension to press: negative stock (ADR-0006) + weighted average — cost when qty ≤ 0? Edge cases in the PRD table need re-checking against permissive stock.
- Depends on D2 (materials/UoM) and the F3 money model.

## Review flags (from foundation-ADR review, 2026-09-13)

- **[FLAG #2] weightedAvgCost is unsafe for negative qty.** The existing formula (`shared/domain/costing.ts`) does `if totalQty.isZero() return zero` but does NOT handle `oldQty < 0`. Under permissive stock (ADR-0006), `oldQty` can be negative; then `(oldQty×oldCost + inQty×inCost) / (oldQty+inQty)` can produce a nonsensical or divide-near-zero cost. ADR-0006 says "HPP on negative stock uses last known cost" — reconcile the formula with that. This is a real gap to resolve here, not copy from the PRD.
