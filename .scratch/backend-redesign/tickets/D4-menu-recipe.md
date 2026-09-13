# D4 · Menu & Recipe domain (items, modifiers, BOM, recipe→deduction)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: D2

## Question

Press: per-location Menu Items, Categories, Modifier Groups + Options (price adjustments), Recipe/BOM (materials + quantities per item), and how a recipe drives stock deduction on sale. Modifier→recipe override is a stated non-goal (base recipe only) — confirm that boundary.

## Notes

- Raw material: `docs/product/04-prd-menu.md`. Existing: `menu` (complex: item/category/modifier/assignment/composed), `recipe`.
- Feeds the deduction path graded in POS (D6) and costing (D3).
- `menu.module.ts` is the non-conforming wiring flagged in ADR-0001 (global cache import + duck-typing) — note for the implementation phase.
