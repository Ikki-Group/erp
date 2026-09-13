# D7 · Production domain (semi-finished items)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: D5

## Question

Press: production recipes (semi-finished item = material produced internally from other materials), production orders (consume input materials → produce output material), and how this interacts with stock movements and costing (the produced item's cost derives from its inputs).

## Notes

- Raw material: `docs/product/03-prd-master-data-production.md`. Existing: `production` module (un-migrated).
- Depends on D5 (inventory movements) and D3 (costing) since production both consumes and produces stock at a cost.
