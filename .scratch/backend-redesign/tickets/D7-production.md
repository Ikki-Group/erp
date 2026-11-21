# D7 · Production domain (semi-finished items)

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: D5 ✅

## Resolution (2026-09-13)

**Decision:** `completeProduction` atomic in one UoW via `recordMovement`; consume inputs permissively (sale rule, not warehouse); permissive sales override the PRD "rejected" claim; add `production_in`/`production_out` movement types. Full decision in [`docs/adr/0014-production-domain.md`](../../../docs/adr/0014-production-domain.md).

Settled Q1–Q4:
- Q1: completeProduction in one UoW — consume inputs (production_out) + produce output (production_in) with output cost = Σ(input consumed × input cost)/actualQty; all via recordMovement.
- Q2: production consume = SALE rule (fully permissive, assignment permissive); output material must be assigned.
- Q3: permissive sales override PRD "rejected when semi-finished zero" — sale proceeds, ingredient goes negative (signal).
- Q4: add production_in (sets cost, inbound) / production_out (cost-neutral, outbound) to ADR-0011 movement types.

## Question

Press: production recipes (semi-finished item = material produced internally from other materials), production orders (consume input materials → produce output material), and how this interacts with stock movements and costing (the produced item's cost derives from its inputs).

## Notes

- Raw material: `docs/product/03-prd-master-data-production.md`. Existing: `production` module (un-migrated).
- Depends on D5 (inventory movements) and D3 (costing) since production both consumes and produces stock at a cost.
