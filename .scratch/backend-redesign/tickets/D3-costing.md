# D3 · Costing domain (per-location weighted average, transfer cost flow, HPP)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: D2

## Question

Press: per-location weighted-average cost on `stock_balances.cost_price`; recalculation triggers (receiving + transfer received); transfer cost flow (source cost captured on transfer-out, flows to destination); HPP = location cost × recipe usage. Does this hold under permissive stock (ADR-0006) — what is HPP/cost when stock is negative?

## Notes

- Raw material: `docs/product/03-prd-master-data-costing.md`. Existing: `shared/domain/costing.ts` (weightedAvgCost over Money/Qty, per ADR-0003).
- Tension to press: negative stock (ADR-0006) + weighted average — cost when qty ≤ 0? Edge cases in the PRD table need re-checking against permissive stock.
- Depends on D2 (materials/UoM) and the F3 money model.
