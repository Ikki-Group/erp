# ADR-0012: Menu & Recipe Domain

**Status:** Accepted
**Date:** 2026-09-13
**Depends on:** ADR-0003 (Money/Qty), ADR-0008 (location type = store), ADR-0009 (materials/UoM), ADR-0010 (HPP), ADR-0011 (deduction via recordMovement).
**Reviews:** the AI-generated `docs/product/04-prd-menu.md`.

## Context

Menu Items, Categories, Modifier Groups/Options, and Recipes (BOM) are all **per-location** (store-only, ADR-0008). Recipe drives stock deduction (ADR-0011) and HPP (ADR-0010). The key design boundary to lock is the Phase-1 simplification: modifiers affect price but not the recipe.

## Decision

### 1. Modifiers affect price, not stock (Phase-1 boundary, locked)

- Auto-deduction on sale uses the item's **active base recipe only** — modifiers are ignored for stock. `deductForOrder` (ADR-0011) deducts base recipe × quantity.
- Modifier options carry a `priceAdjustment` (into the order total) but have **no recipe**. "Modifier → recipe override" is backlogged (vision non-goal).
- This is a conscious simplification; adding modifier-driven deduction later is a new feature, not a re-open.

### 2. Menu structure (per-location, store-only)

- Menu Item: `locationId`, `sku` unique **within a location**, `basePrice`, `status`. Belongs to exactly one store (ADR-0008 enforces store-type). Inactive items can't be ordered but stay in historical reports.
- Menu Category: per-location, hierarchical (`parentId`), `sortOrder`.
- Modifier Group: per-location, `selectionType` (single/multiple), `isRequired`, `minSelect`/`maxSelect`. Options: `priceAdjustment` (may be negative), `isDefault`, `isActive`. Groups are many-to-many with items **within the same location** and reusable across items there.

### 3. Recipe / BOM

- Exactly **one active recipe per menu item** (partial unique index `recipes_menu_item_active_uniq`, consistent with the one-active pattern, ADR-0006). `yieldQty` = units per batch.
- Recipe lines reference **global materials** (ADR-0009) with a quantity and UoM; the line UoM **must be convertible** to the material's base UoM (validated via the pure resolver, ADR-0009).
- Deleting/deactivating a material used by an active recipe is **blocked** (extends the ADR-0009 "no delete with stock" rule).
- HPP is computed per ADR-0010 (location cost × recipe usage ÷ yield), updating automatically as material cost changes.

### 4. Price snapshotting (boundary with POS/D6)

- Menu exposes an **enriched read** via its `Api` (`itemDetail`: item + modifier groups + options + prices) that POS consumes when building/syncing an order line.
- The order line stores a **snapshot** of prices at transaction time (base price, modifier `priceAdjustment`, names) — not a live reference. Changing a menu price later never alters historical orders. The order-line shape itself is D6; this ADR locks that menu provides snapshot data via `Api` and that menu prices are free to change without touching past orders.

## Alternatives Considered

- **Modifier-driven recipe deduction now.** Rejected: a vision non-goal; base-recipe deduction is the Phase-1 boundary.
- **Global menu (shared across locations).** Rejected: Coffee and Resto sell different things; menu is per-location by design.
- **Order line referencing live menu prices.** Rejected: a later price change would rewrite history; snapshot at transaction time instead.

## Consequences

- **Easier:** deduction is base-recipe-only (simple, mechanical); menu is cleanly per-location; historical orders are price-stable.
- **Harder:** modifier-driven costing is deferred (accepted); the enriched `itemDetail` read must assemble item+groups+options efficiently.
- **Constraint:** modifiers affect price not stock; one active recipe per item; recipe UoM convertible to base; material-in-active-recipe can't be deleted; order lines snapshot prices via the menu `Api`.
