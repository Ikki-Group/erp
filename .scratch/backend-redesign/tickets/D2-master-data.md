# D2 · Master Data domain (Material, UoM chain, Supplier, location assignment)

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: D1 ✅

## Resolution (2026-09-13)

**Decision:** Assignment is a hard constraint for receiving/transfer but permissive for POS sale deduction; UoM resolver becomes a pure `Qty` calculator; Material global catalog with base UoM + optional default hints, cost per-location. Full decision in [`docs/adr/0009-master-data-domain.md`](../../../docs/adr/0009-master-data-domain.md).

Settled Q1–Q3:
- Q1: assignment hard-constraint for receiving/transfer (data discipline, like transfer-out); POS sale deduction permissive (records movement, never blocks on unassigned material). Resolves the flagged non-blocking tension.
- Q2: UoM resolver refactored to pure calculator over `Qty` (ADR-0003) — remove raw Decimal + lossy `.toNumber()`; keep BFS graph.
- Q3: Material model ratified — baseUom source of truth, 3 optional default UoMs (must be convertible), type raw/semi_finished, global unique, soft-delete, no cost field (cost is per-location).

## Question

Press: global Material catalog + manual per-location assignment (hard constraint — no stock/receiving/transfer unless assigned; assignment removal blocked when stock > 0); UoM chain (multi-hop conversion karton→L→ml, resolved purely); Supplier + per-supplier material pricing. Is the assignment-as-hard-constraint right given the permissive/non-blocking principle from ADR-0006?

## Notes

- Raw material: `docs/product/03-prd-master-data.md`. Existing: `material` (complex module, has assignment + category sub-entities), `uom` (with `resolveConversion` pure resolver), `supplier`.
- Tension to press: ADR-0006 says non-blocking, but assignment is described as a hard constraint that *rejects* operations. Reconcile.
