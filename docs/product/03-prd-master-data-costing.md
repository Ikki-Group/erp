# PRD: Weighted Average Costing

Per-location cost calculation, material-location assignment, and HPP derivation.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Cost scope | Per-location (each location has its own cost per material) |
| Cost storage | `stock_balances.cost_price` (not on materials table) |
| Recalculation trigger | Receiving from supplier + Transfer received |
| Transfer cost | Source cost flows to destination (Opsi A) |
| HPP source | Location cost where the order happens |
| Adjustment impact on cost | None — adjustments change qty only, not cost |
| Material visibility | Hard constraint — material must be assigned to location |

## Material-Location Assignment

Materials are defined globally but **assigned manually** to locations. This controls:

- **Visibility:** Users only see materials assigned to their active location.
- **Hard constraint:** A material cannot have stock, receive goods, or be transferred to a location unless assigned.
- **Purpose:** Keep each location's data lean — only materials relevant to that location appear.

### Assignment Table

| Field | Type | Description |
|-------|------|-------------|
| materialId | FK | Global material |
| locationId | FK | Assigned location |

Unique: `(material_id, location_id)`

### Rules

- A material can be assigned to multiple locations.
- Removing an assignment is blocked if `stock_balances.quantity > 0` at that location.
- Transfer request is rejected if the material is not assigned at the destination.
- Receiving is rejected if the material is not assigned at the receiving location.

## Cost Per Location

Each `stock_balances` record holds the cost for that material at that location:

```
stock_balances {
  material_id
  location_id
  quantity        -- on-hand qty (storage UoM)
  cost_price      -- weighted average cost per unit at THIS location
}
```

Different locations can have different costs for the same material — because they may receive from different suppliers at different prices, or receive transfers from other locations at their source cost.

## Weighted Average Formula

### On Receiving (from supplier)

```
new_cost = (existing_qty × existing_cost + received_qty × received_unit_cost)
           / (existing_qty + received_qty)
```

Where:
- `existing_qty` = current `stock_balances.quantity` at this location
- `existing_cost` = current `stock_balances.cost_price` at this location
- `received_qty` = quantity received (converted to storage UoM)
- `received_unit_cost` = cost per unit from the receiving record (converted to storage UoM)

### On Transfer Received (from another location)

```
new_cost = (existing_qty × existing_cost + transferred_qty × source_cost)
           / (existing_qty + transferred_qty)
```

Where:
- `source_cost` = `stock_balances.cost_price` of the material at the **source** location at time of shipment
- Captured in `stock_movements.cost_price` when the transfer_out movement is created

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Existing qty = 0, receive new stock | `cost_price = received_unit_cost` |
| Existing qty = 0, transfer in | `cost_price = source_cost` |
| Stock adjustment (waste, opname) | Cost unchanged — only qty changes |
| Void sale (stock returned) | Cost unchanged — only qty restored |
| Material newly assigned (no stock yet) | `cost_price = 0` until first receiving/transfer |

## Transfer Cost Flow

```
Example:
  Warehouse: Susu 50L × Rp 14.000/L
  Coffee:    Susu 5L × Rp 16.000/L

Transfer 10L from Warehouse → Coffee:

  1. Source (Warehouse):
     stock_movement: type=transfer_out, qty=10, cost_price=14.000
     stock_balance: qty = 50 - 10 = 40L, cost unchanged (Rp 14.000)

  2. Destination (Coffee):
     stock_movement: type=transfer_in, qty=10, cost_price=14.000
     new_cost = (5 × 16.000 + 10 × 14.000) / (5 + 10) = 14.667
     stock_balance: qty = 15L, cost = Rp 14.667/L
```

Transfer does NOT change cost at the source — only at the destination (receiving side).

## HPP Calculation

When an order is completed at a location:

```
For each order_line:
  recipe = active recipe for menu_item
  for each recipe_line:
    material_cost = stock_balances.cost_price WHERE material_id AND location_id
    ingredient_cost = recipe_line.quantity × material_cost × uom_conversion_factor
  line_hpp = sum(ingredient_costs) / recipe.yield_qty × order_line.quantity

order_hpp = sum(line_hpp for all order_lines)
```

HPP uses the **location's cost** (not global) — reflecting actual cost of materials at that store.

## UoM Conversion in Cost

Costs are always stored in **storage UoM**. When receiving, convert:

```
Example:
  Material: Susu (purchase=Karton, storage=Liter, recipe=Mililiter)
  Receive: 2 Karton × Rp 180.000/Karton
  Conversion: 1 Karton = 12 Liter

  received_qty_storage = 2 × 12 = 24 Liter
  received_cost_storage = 180.000 / 12 = Rp 15.000/Liter

  Weighted average uses: 24L at Rp 15.000/L
```

For HPP, convert recipe UoM to storage UoM:
```
  Recipe: 200ml susu
  Conversion: 1 Liter = 1000 Mililiter → 200ml = 0.2L
  Cost: 0.2 × Rp 15.000 = Rp 3.000 per serving
```

## Impact on Data Model

Previous assumption was `materials.cost_price` (global). This changes to:

| Before | After |
|--------|-------|
| `materials.cost_price` | Removed — no global cost |
| — | `stock_balances.cost_price` — per location per material |
| `stock_movements.cost_price` | Kept — records cost at time of movement |

## Reports Affected

- **HPP per menu item** — now location-specific (same item can have different HPP at different stores)
- **Stock valuation** — `sum(qty × cost_price)` per location, or across all locations
- **Margin analysis** — per location (revenue - location-specific HPP)

---

**Next:** [04-prd-menu.md](./04-prd-menu.md) — Menu, Modifiers, Recipes.
