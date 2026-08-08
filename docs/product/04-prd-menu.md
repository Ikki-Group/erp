# PRD: Menu

Specifications for Menu Items, Categories, Modifier Groups, and Recipes. All scoped **per-location**.

## Menu Item

### Purpose

Sellable products — what customers order at POS. Each location (store) has its own independent menu catalog.

### Fields

| Field       | Type    | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| locationId  | FK      | Which store this item belongs to             |
| sku         | string  | Unique within the location                   |
| name        | string  | Item name (e.g. "Iced Latte", "Nasi Goreng") |
| description | string? | Optional description                         |
| categoryId  | FK?     | Menu category                                |
| basePrice   | decimal | Default selling price                        |
| status      | enum    | `active`, `inactive`                         |
| imageUrl    | string? | Product image                                |

### Menu Category

Hierarchical per-location: Beverages > Coffee > Espresso-based.

| Field      | Type    | Description                     |
| ---------- | ------- | ------------------------------- |
| locationId | FK      | Belongs to which store          |
| name       | string  | Category name                   |
| parentId   | FK?     | Parent category (null for root) |
| sortOrder  | integer | Display order                   |

### Business Rules

- SKU is unique within a location (not globally).
- Menu items belong to exactly one location.
- Inactive items cannot be ordered at POS but appear in historical reports.
- Each store manages its own menu independently.

## Modifier Group

### Purpose

Define customization options for menu items: sizes, sugar levels, toppings, temperatures, etc.

### Modifier Group Fields

| Field         | Type     | Description                                        |
| ------------- | -------- | -------------------------------------------------- |
| locationId    | FK       | Which store                                        |
| name          | string   | Group name (e.g. "Size", "Sugar Level", "Topping") |
| selectionType | enum     | `single` (pick one), `multiple` (pick many)        |
| isRequired    | boolean  | Must select at least one option?                   |
| minSelect     | integer  | Minimum selections (for multiple)                  |
| maxSelect     | integer? | Maximum selections (null = unlimited)              |

### Modifier Option Fields

| Field           | Type    | Description                                         |
| --------------- | ------- | --------------------------------------------------- |
| groupId         | FK      | Parent modifier group                               |
| name            | string  | Option name (e.g. "Regular", "Large", "Extra Shot") |
| priceAdjustment | decimal | Price change (+5000, 0, -2000)                      |
| isDefault       | boolean | Pre-selected option                                 |
| sortOrder       | integer | Display order                                       |
| isActive        | boolean | Available toggle                                    |

### Menu Item ↔ Modifier Group (Many-to-Many)

A menu item can have multiple modifier groups. A modifier group can be shared across menu items within the same location.

| Field           | Type    | Description                             |
| --------------- | ------- | --------------------------------------- |
| menuItemId      | FK      | Menu item                               |
| modifierGroupId | FK      | Modifier group                          |
| sortOrder       | integer | Display order of this group on the item |

### Example

```
Ikki Coffee:
  Iced Latte (basePrice: 25000)
  ├── Modifier Group: "Size" (single, required)
  │   ├── Regular (+0, default)
  │   └── Large (+5000)
  ├── Modifier Group: "Sugar" (single, required)
  │   ├── Normal (+0, default)
  │   ├── Less (+0)
  │   └── None (+0)
  └── Modifier Group: "Extra" (multiple, optional, max 3)
      ├── Extra Shot (+5000)
      └── Oat Milk (+8000)

Order: Iced Latte, Large, Less Sugar, Extra Shot
  → 25000 + 5000 + 0 + 5000 = Rp 35.000
```

### Business Rules

- Modifier groups are per-location (not shared across locations).
- A group can be reused by multiple items in the same location (e.g. "Size" applies to all drinks).
- `single` + `isRequired` = user must pick exactly one (radio button UX).
- `multiple` + `isRequired` = user must pick at least `minSelect`.
- Price adjustment can be negative (discount for choosing a simpler option).
- Inactive options are hidden from POS but preserved in historical orders.

## Recipe / Bill of Materials (BOM)

### Purpose

Define which materials (and quantities) produce one menu item. Enables auto-deduct on sale and HPP calculation.

### Recipe Header

| Field      | Type    | Description                                |
| ---------- | ------- | ------------------------------------------ |
| menuItemId | FK      | Output menu item                           |
| name       | string  | Recipe name (e.g. "Iced Latte - Standard") |
| yieldQty   | decimal | Units produced per batch (usually 1)       |
| isActive   | boolean | Active toggle                              |

### Recipe Line (Ingredient)

| Field      | Type    | Description                                               |
| ---------- | ------- | --------------------------------------------------------- |
| recipeId   | FK      | Parent recipe                                             |
| materialId | FK      | Material consumed (global catalog)                        |
| quantity   | decimal | Amount per batch                                          |
| uomId      | FK      | Unit of the quantity (usually recipe UoM of the material) |

### HPP Calculation

```
HPP per serving = Σ(line.quantity × material.costPrice × uom_conversion_factor) / recipe.yieldQty
```

Example:

```
Iced Latte recipe:
  Espresso Beans: 18g × Rp 0.15/g = Rp 2.700
  Susu Full Cream: 200ml × Rp 0.025/ml = Rp 5.000
  Cup 16oz: 1 pcs × Rp 1.500/pcs = Rp 1.500
  ──────────────────────────────────────────────
  HPP = Rp 9.200
  Selling price = Rp 25.000
  Margin = 63%
```

### Phase 1 Limitations

- One recipe per menu item (no variants per modifier).
- Auto-deduct uses base recipe regardless of modifiers selected.
- Modifier → recipe override is **backlogged** for future implementation.

### Business Rules

- A menu item can have exactly one active recipe (Phase 1).
- Recipe ingredients reference global materials (not location-specific).
- UoM in recipe lines must be convertible to the material's storage UoM.
- HPP updates automatically when material cost changes.
- Deleting a material that's in an active recipe is blocked.

## Moka Data Mapping

Moka uses **variants** (flat SKU per combination). Our system uses **modifiers** (base item + options).

### Import Mapping

```
Moka:                           Our system:
"Iced Latte - Regular"    →     Iced Latte + Size:Regular
"Iced Latte - Large"      →     Iced Latte + Size:Large
"Nasi Goreng - Pedas 3"   →     Nasi Goreng + Level:3
```

Mapping is configured manually per location during Moka import setup. Each Moka variant maps to: `menuItemId + modifierOption[]`.

---

**Next:** [05-prd-pos.md](./05-prd-pos.md) — POS module.
