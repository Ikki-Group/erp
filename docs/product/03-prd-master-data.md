# PRD: Master Data

Specifications for Material (bahan baku), Unit of Measure (chain conversion), and Supplier.

## Material (Bahan Baku)

### Purpose

Raw materials consumed by recipes. Tracked per location. **Global catalog** — shared across all locations for easy transfer.

### Fields

| Field                | Type     | Description                                              |
| -------------------- | -------- | -------------------------------------------------------- |
| code                 | string   | Unique material code                                     |
| name                 | string   | Material name (e.g. "Espresso Beans", "Susu Full Cream") |
| categoryId           | FK?      | Material category                                        |
| baseUomId            | FK       | Base unit of measure (source of truth for stock balance) |
| defaultPurchaseUomId | FK?      | Default UoM shown in receiving forms (fallback: baseUom) |
| defaultStockUomId    | FK?      | Default UoM shown in stock views (fallback: baseUom)     |
| defaultRecipeUomId   | FK?      | Default UoM shown in recipe forms (fallback: baseUom)    |
| minStock             | decimal? | Alert threshold (in base UoM, across all locations)      |

> Note: `cost_price` lives on `stock_balances` (per-location), not here. See [03-prd-master-data-costing.md](./03-prd-master-data-costing.md).

### Material Category

Flat grouping: Dairy, Dry Goods, Frozen, Fresh Produce, Packaging, Cleaning, etc.

### UoM Model

Each material has one **base UoM**. Conversions are defined in the UoM conversion table (not on material). Default display UoMs are optional hints for the UI.

```
Susu Full Cream:
  baseUom: Liter
  defaultPurchaseUom: Karton   (UI pre-selects "Karton" on receiving forms)
  defaultStockUom: Liter       (UI shows stock in "Liter")
  defaultRecipeUom: Mililiter  (UI pre-selects "ml" in recipe ingredient)
  conversions (via uom_conversions): Karton→Liter ×12, Liter→Mililiter ×1000

Cup 12oz:
  baseUom: Pcs
  defaultPurchaseUom: null     (fallback to Pcs)
  defaultStockUom: null        (fallback to Pcs)
  defaultRecipeUom: null       (fallback to Pcs)
  conversions: (none needed — single UoM)

Gula Pasir:
  baseUom: Kilogram
  defaultPurchaseUom: Sak      (UI shows "Sak" on receiving)
  defaultStockUom: Kilogram    (stock shown in Kg)
  defaultRecipeUom: Gram       (recipe in Gram)
  conversions: Sak→Kg ×50, Kg→Gram ×1000
```

- **base UoM** = how stock_balances.quantity is stored internally.
- **default UoMs** = pre-selected UoM in UI forms. User can still override.
- **Conversions** = defined in the UoM system, not on the material itself. Material just references which UoMs it uses.

### Business Rules

- Code is globally unique.
- `minStock` alert fires when total stock across all locations < threshold (in base UoM).
- Materials cannot be deleted if stock balance > 0 anywhere (deactivate instead).
- Default display UoMs must be convertible to base UoM via the conversion chain.
- If default UoM is null, UI falls back to base UoM.

## Unit of Measure (UoM)

### Purpose

Standardize measurement units with **chain conversions** — enabling multi-hop resolution.

### UoM Fields

| Field    | Type   | Description                                 |
| -------- | ------ | ------------------------------------------- |
| code     | string | Short code (kg, g, L, ml, pcs, karton, sak) |
| name     | string | Full name (Kilogram, Gram, Liter)           |
| category | enum   | `weight`, `volume`, `quantity`, `length`    |

### UoM Conversion (Chain)

| Field     | Type    | Description                           |
| --------- | ------- | ------------------------------------- |
| fromUomId | FK      | Source unit                           |
| toUomId   | FK      | Target unit                           |
| factor    | decimal | Multiply source by this to get target |

### Chain Example

```
Karton ──(×12)──→ Liter ──(×1000)──→ Mililiter

Resolution: 1 Karton = ? Mililiter
  → 1 × 12 × 1000 = 12,000 ml
```

```
Sak ──(×50)──→ Kilogram ──(×1000)──→ Gram

Resolution: 1 Sak = ? Gram
  → 1 × 50 × 1000 = 50,000 g
```

### Conversion Rules

- Conversions only within the same category (weight↔weight, volume↔volume).
- System resolves multi-hop by traversing the chain (max depth configurable, default 5).
- Conversion factor must be > 0.
- If no path exists between two UoMs, the conversion fails (explicit error).
- System UoMs (kg, g, L, ml, pcs) cannot be deleted.
- Custom UoMs can be created (karton, sak, botol, sachet, etc.).

### Resolving Conversions

```
Input: fromUom=Karton, toUom=Mililiter, qty=2

1. Find path: Karton → Liter → Mililiter
2. Apply factors: 2 × 12 × 1000 = 24,000
3. Result: 24,000 ml
```

If path goes the other direction (e.g. Mililiter → Liter), use inverse (÷ factor):

```
Input: fromUom=Mililiter, toUom=Liter, qty=500

1. Find path: Mililiter → Liter (inverse of Liter→Mililiter)
2. Apply: 500 ÷ 1000 = 0.5
3. Result: 0.5 L
```

## Supplier

### Purpose

Vendors who supply materials. Reference data for purchasing.

### Fields

| Field         | Type     | Description                            |
| ------------- | -------- | -------------------------------------- |
| code          | string   | Unique supplier code                   |
| name          | string   | Supplier name                          |
| contactPerson | string?  | Contact name                           |
| phone         | string?  | Phone                                  |
| email         | string?  | Email                                  |
| address       | string?  | Address                                |
| paymentTerms  | integer? | Default credit days (e.g. 30 = NET 30) |
| isActive      | boolean  | Active/inactive                        |

### Supplier-Material Price

Track which suppliers provide which materials at what reference price.

| Field       | Type     | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| supplierId  | FK       | Supplier                                        |
| materialId  | FK       | Material                                        |
| unitPrice   | decimal  | Reference price per unit                        |
| uomId       | FK       | Unit the price refers to (usually purchase UoM) |
| minOrderQty | decimal? | Minimum order quantity                          |

### Business Rules

- A material can have multiple suppliers.
- Supplier-material prices are reference data — actual PO prices can differ.
- Soft-delete suppliers to preserve purchase history.
- `paymentTerms` determines default due date on AP entries.

---

**Next:** [04-prd-menu.md](./04-prd-menu.md) — Menu, Modifiers, Recipes.
