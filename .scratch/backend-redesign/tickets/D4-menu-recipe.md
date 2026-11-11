# D4 · Menu & Recipe domain (items, modifiers, BOM, recipe→deduction)

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: D2 ✅

## Resolution (2026-09-13)

**Decision:** Modifiers affect price not stock (Phase-1 boundary locked); per-location menu, one active recipe per item; price snapshotting at order-line time via menu `Api`. Full decision in [`docs/adr/0012-menu-recipe-domain.md`](../../../docs/adr/0012-menu-recipe-domain.md).

Settled Q1–Q3:
- Q1: modifiers affect price only; deduction uses active base recipe (modifiers ignored for stock) — Phase-1 boundary, backlog override.
- Q2: one active recipe per item (partial unique); recipe lines → global materials, UoM convertible to base; material in active recipe can't be deleted.
- Q3: menu exposes enriched `itemDetail` via Api; order line snapshots prices at transaction time; menu price changes don't alter historical orders.

## Question

Press: per-location Menu Items, Categories, Modifier Groups + Options (price adjustments), Recipe/BOM (materials + quantities per item), and how a recipe drives stock deduction on sale. Modifier→recipe override is a stated non-goal (base recipe only) — confirm that boundary.

## Notes

- Raw material: `docs/product/04-prd-menu.md`. Existing: `menu` (complex: item/category/modifier/assignment/composed), `recipe`.
- Feeds the deduction path graded in POS (D6) and costing (D3).
- `menu.module.ts` is the non-conforming wiring flagged in ADR-0001 (global cache import + duck-typing) — note for the implementation phase.
