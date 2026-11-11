# ADR-0014: Production Domain (semi-finished items)

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0002 (atomic UoW), ADR-0003/0010 (Money/cost), ADR-0006 (permissive stock), ADR-0009 (material type), ADR-0011 (recordMovement).
**Reviews:** the AI-generated `docs/product/03-prd-master-data-production.md`. **Extends:** ADR-0011 (adds `production_in`/`production_out` movement types).

## Context

Some materials are `semi_finished` — produced internally from other materials (e.g. Gula Cair from Gula + Air) rather than purchased. They are ordinary materials (stock, cost, transfer, usable in menu recipes, ADR-0009), restocked via a **production order** instead of receiving. Production consumes inputs and produces an output, computing the output's cost from the inputs.

## Decision

### 1. `completeProduction` is one atomic UoW use-case

Inside one UoW (ADR-0002), mirroring `completeOrder` (ADR-0013):
1. load production order + active production recipe; assert `draft`
2. compute per-input deduction `(line.qty / recipe.yieldQty) × actualQty` (pure calculator, ADR-0003)
3. for each input: `recordMovement(production_out, tx)`
4. compute output cost `Σ(input_qty_consumed × input_cost_price) / actualQty` (pure calculator)
5. `recordMovement(production_in, tx)` for the output using that cost
6. audit

All stock changes go through `recordMovement` (sole writer, ADR-0011). Post-commit: events (`StockMovementRecorded` journal hook).

### 2. Production consume is permissive (follows the SALE rule, not the warehouse rule)

- Consuming inputs is like a sale (using materials to produce something at the same location), **not** like transfer-out (shipping physical goods away). So it is **fully permissive**: input stock may go negative and never blocks production; assignment is permissive here too, exactly as POS sale deduction (ADR-0009).
- The output material (`semi_finished`) must be assigned at the production location.
- Rationale: the non-blocking principle (ADR-0006) — don't block production staff over imperfect input stock records; negative input stock is a signal.

### 3. Permissive sales override the PRD's "rejected" claim

- The PRD says selling a drink whose `semi_finished` ingredient (Gula Cair) is at zero is *rejected*. This **contradicts** the permissive principle and is **consciously overridden**: the sale proceeds, Gula Cair goes negative (a "produce more" signal), consistent with ADR-0006/0013.

### 4. Production movement types (extends ADR-0011)

- `production_out` (direction out): input consumed — like a sale, **does not** change cost.
- `production_in` (direction in): output produced — like receiving, **sets/blends** cost using the computed output cost (weighted average per ADR-0010; if destination on-hand ≤ 0, cost becomes the computed output cost).
- These join the ADR-0011 movement-type set.

### 5. Production recipe

- One active production recipe per `semi_finished` material (partial unique, one-active pattern, ADR-0006). `yieldQty`/`yieldUomId` (should match the output material's base UoM).
- Input lines reference any material (`raw` or `semi_finished` — nested production allowed), with quantity + UoM convertible to the input's base UoM (pure resolver, ADR-0009).
- Production order numbered `PRD-{LOC}-{YYYYMMDD}-{SEQ}` (ADR-0008 numbering). Status `draft → completed`/`cancelled`.

## Alternatives Considered

- **Production consume checked like transfer-out.** Rejected: production is internal consumption (like a sale), not physical shipment; blocking it violates the non-blocking principle.
- **Reject sales when a semi-finished ingredient is zero (per PRD).** Rejected: contradicts permissive stock; sales never block.

## Consequences

- **Easier:** production reuses the order-completion pattern and `recordMovement`; cost flows through the established weighted-average rules.
- **Harder:** nested production (semi-finished consuming semi-finished) means cost depends on the input's current cost — correct as long as inputs are produced first; negative input stock still yields a computable output cost from last known input costs.
- **Constraint:** `completeProduction` runs in one UoW via `recordMovement`; consume is permissive (sale rule); `production_in` sets cost, `production_out` doesn't; one active production recipe per semi-finished material.
