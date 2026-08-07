# ERD: Master Data

Materials, UoM (chain), Suppliers. All global (not scoped to location).

## Mermaid

```mermaid
erDiagram
    MATERIAL_CATEGORIES {
        int id PK
        string name
    }
    MATERIALS {
        int id PK
        string code UK
        string name
        string type "raw | semi_finished"
        int category_id FK
        int base_uom_id FK
        int default_purchase_uom_id FK "nullable"
        int default_stock_uom_id FK "nullable"
        int default_recipe_uom_id FK "nullable"
        decimal min_stock "nullable"
    }
    MATERIAL_LOCATIONS {
        int id PK
        int material_id FK
        int location_id FK
    }
    UOMS {
        int id PK
        string code UK
        string name
        string category "weight | volume | quantity"
    }
    UOM_CONVERSIONS {
        int id PK
        int from_uom_id FK
        int to_uom_id FK
        decimal factor
    }
    SUPPLIERS {
        int id PK
        string code UK
        string name
        int payment_terms
        boolean is_active
    }
    SUPPLIER_MATERIALS {
        int id PK
        int supplier_id FK
        int material_id FK
        decimal unit_price
        int uom_id FK
    }

    MATERIAL_CATEGORIES ||--o{ MATERIALS : "groups"
    UOMS ||--o{ MATERIALS : "base unit"
    UOMS ||--o{ UOM_CONVERSIONS : "from"
    UOMS ||--o{ UOM_CONVERSIONS : "to"
    MATERIALS ||--o{ MATERIAL_LOCATIONS : "assigned to"
    LOCATIONS ||--o{ MATERIAL_LOCATIONS : "has"
    SUPPLIERS ||--o{ SUPPLIER_MATERIALS : "provides"
    MATERIALS ||--o{ SUPPLIER_MATERIALS : "supplied by"
```

[Open/Edit diagram](https://l.mermaid.ai/IRMjep)

## Diagram

```
[material_categories]
  PK id
  -- name


[materials]
  PK id
  UK code
  -- name
  FK category_id - - → material_categories
  FK purchase_uom_id ────── uoms
  FK storage_uom_id ─────── uoms
  FK recipe_uom_id ──────── uoms
  -- cost_price numeric(18,6)
  -- min_stock numeric(18,6) nullable
  -- audit stamps


[uoms]                           [uom_conversions]
  PK id                            PK id
  UK code                          FK from_uom_id ────── uoms
  -- name                          FK to_uom_id ──────── uoms
  -- category (weight/volume/      -- factor numeric(18,6)
       quantity/length)            UK (from_uom_id, to_uom_id)


[suppliers]                      [supplier_materials]
  PK id                            PK id
  UK code                          FK supplier_id ────── suppliers
  -- name                          FK material_id ───── materials
  -- contact_person                -- unit_price numeric(18,2)
  -- phone, email, address         FK uom_id ────────── uoms
  -- payment_terms integer?        -- min_order_qty numeric(18,6)?
  -- is_active                     UK (supplier_id, material_id)
  -- audit stamps
```

## UoM Chain

Conversions form a directed graph within a category:

```
Karton ──(×12)──→ Liter ──(×1000)──→ Mililiter
Sak ──(×50)──→ Kilogram ──(×1000)──→ Gram
```

Resolution traverses the chain (max 5 hops). Inverse = divide by factor.

## Notes

- Materials have 3 UoM references: purchase, storage, recipe.
- `cost_price` is weighted average in storage UoM.
- `uom_conversions` only valid within same category.

---

**Next:** [menu.md](./menu.md) — Menu Items, Modifiers, Recipes.
