# D2 · Master Data domain (Material, UoM chain, Supplier, location assignment)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: D1

## Question

Press: global Material catalog + manual per-location assignment (hard constraint — no stock/receiving/transfer unless assigned; assignment removal blocked when stock > 0); UoM chain (multi-hop conversion karton→L→ml, resolved purely); Supplier + per-supplier material pricing. Is the assignment-as-hard-constraint right given the permissive/non-blocking principle from ADR-0006?

## Notes

- Raw material: `docs/product/03-prd-master-data.md`. Existing: `material` (complex module, has assignment + category sub-entities), `uom` (with `resolveConversion` pure resolver), `supplier`.
- Tension to press: ADR-0006 says non-blocking, but assignment is described as a hard constraint that *rejects* operations. Reconcile.
