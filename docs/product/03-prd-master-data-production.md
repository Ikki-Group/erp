# PRD: Semi-Finished Items & Production

Specifications for semi-finished materials (produced internally) and production orders.

## Concept

Some materials are not purchased from suppliers — they are **produced internally** from other materials.

```
Gula Cair (semi_finished):
  Input: Gula 1kg + Air 20ml
  Output: Gula Cair 1L

Used in: Iced Latte recipe (30ml per cup)
```

Semi-finished items are tracked as regular materials in stock. They just have a different source: production instead of purchasing.

## Material Type

| Type | Source | Example |
|------|--------|---------|
| `raw` | Purchased from supplier | Gula, Susu, Kopi, Cup, Sedotan |
| `semi_finished` | Produced internally from other materials | Gula Cair, Bumbu Racik |

Both types:
- Have stock balances (per-location)
- Can be used in menu recipes
- Can be transferred between locations
- Have weighted average cost

Difference:
- `raw` → restocked via **receiving** (from supplier)
- `semi_finished` → restocked via **production order**

## Production Recipe

Defines the BOM (Bill of Materials) for producing a semi-finished item.

### Header

| Field | Type | Description |
|-------|------|-------------|
| materialId | FK | Output material (must be `semi_finished`) |
| name | string | Recipe name (e.g. "Gula Cair - Standard") |
| yieldQty | decimal | Output quantity per batch |
| yieldUomId | FK | Output unit (should match material's base UoM) |
| isActive | boolean | Active toggle |

### Line (Input)

| Field | Type | Description |
|-------|------|-------------|
| recipeId | FK | Parent production recipe |
| materialId | FK | Input material (can be `raw` or `semi_finished`) |
| quantity | decimal | Amount consumed per batch |
| uomId | FK | Unit of the input quantity |

### Example

```
Production Recipe: "Gula Cair - Standard"
  Output: Gula Cair, yield 1 Liter
  Inputs:
    - Gula: 1 kg
    - Air: 20 ml
```

### Business Rules

- Output material must be type `semi_finished`.
- Input materials can be any type (`raw` or `semi_finished` — allows nested production).
- One active production recipe per semi-finished material (Phase 1).
- Input material must be assigned to the location where production happens.

## Production Order

Records an actual production event — "I made X amount of semi-finished item today."

### Fields

| Field | Type | Description |
|-------|------|-------------|
| productionNo | string | Auto-generated (format: `PRD-{LOC}-{DATE}-{SEQ}`) |
| locationId | FK | Where production happens |
| materialId | FK | Output material (semi_finished) |
| recipeId | FK | Which production recipe was used |
| status | enum | `draft`, `completed`, `cancelled` |
| plannedQty | decimal | How much was planned to produce |
| actualQty | decimal? | How much was actually produced (set on complete) |
| notes | string? | Production notes (e.g. "slightly thicker today") |
| producedBy | FK | User who performed production |
| completedAt | timestamp? | When completed |

### Status Flow

```
draft → completed
  ↓
cancelled
```

### On Complete

1. **Deduct inputs** from stock at this location:
   - For each recipe line: deduct `(line.quantity / recipe.yieldQty) × actualQty`
   - Create `stock_movement` (type: `production_out`, direction: `out`)

2. **Add output** to stock at this location:
   - Add `actualQty` of the output material
   - Create `stock_movement` (type: `production_in`, direction: `in`)

3. **Calculate output cost:**
   ```
   output_cost_per_unit = sum(input_qty_consumed × input_cost_price) / actualQty
   ```
   This becomes the `cost_price` for the production_in movement, and recalculates the weighted average of the semi-finished material at this location.

### Example Flow

```
Production Order: PRD-COFFEE-20260806-001
  Material: Gula Cair
  Recipe: "Gula Cair - Standard" (yield: 1L)
  Planned: 5L
  Actual: 4.8L (slight loss during cooking)

On complete:
  Deduct from Coffee stock:
    Gula: (1kg / 1L) × 4.8L = 4.8 kg
    Air: (20ml / 1L) × 4.8L = 96 ml

  Add to Coffee stock:
    Gula Cair: 4.8L

  Cost calculation:
    Gula cost at Coffee: Rp 14.000/kg → 4.8kg = Rp 67.200
    Air cost at Coffee: Rp 5/ml → 96ml = Rp 480
    Total input cost: Rp 67.680
    Output cost: Rp 67.680 / 4.8L = Rp 14.100/L

  Gula Cair weighted average at Coffee updated.
```

## Stock Movement Types (Updated)

| Type | Direction | Trigger |
|------|-----------|---------|
| `purchase_receipt` | in | Receiving from supplier |
| `transfer_in` | in | Received from another location |
| `production_in` | in | **Production output** |
| `adjustment_in` | in | Manual correction |
| `return_in` | in | Void/refund restoration |
| `sales` | out | POS order (via menu recipe) |
| `transfer_out` | out | Sent to another location |
| `production_out` | out | **Production input consumed** |
| `adjustment_out` | out | Manual correction (waste, expired) |

## Relationship to Menu Recipe

Menu recipes can reference semi-finished materials as ingredients:

```
Menu Recipe: Iced Latte
  - Espresso Beans: 18g (raw)
  - Susu: 200ml (raw)
  - Gula Cair: 30ml (semi_finished) ← produced internally
  - Cup 16oz: 1 pcs (raw)
```

When Iced Latte is sold, stock of Gula Cair is deducted. Staff must ensure Gula Cair is produced ahead of time (otherwise stock goes to zero → rejected).

## New Module: `production`

| Entity | Purpose |
|--------|---------|
| production_recipes | BOM for semi-finished items |
| production_recipe_lines | Input materials for production |
| production_orders | Record of each production batch |

Layer: **2 (Operations)** — depends on `material` (layer 1) and `inventory` (layer 2, for stock movements).

## Number Generation

| Document | Prefix | Example |
|----------|--------|---------|
| Production Order | `PRD` | `PRD-COFFEE-20260806-001` |

---

**Next:** [04-prd-menu.md](./04-prd-menu.md) — Menu, Modifiers, Recipes.
