# ERD: Menu

Menu Items, Categories, Modifier Groups, Recipes. All **per-location**.

## Mermaid

```mermaid
erDiagram
    MENU_CATEGORIES {
        int id PK
        int location_id FK
        string name
        int parent_id FK "self-ref"
        int sort_order
    }
    MENU_ITEMS {
        int id PK
        int location_id FK
        string sku UK "unique per location"
        string name
        int category_id FK
        decimal base_price
        string status "active | inactive"
    }
    MODIFIER_GROUPS {
        int id PK
        int location_id FK
        string name
        string selection_type "single | multiple"
        boolean is_required
        int min_select
        int max_select
    }
    MODIFIER_OPTIONS {
        int id PK
        int group_id FK
        string name
        decimal price_adjustment
        boolean is_default
        int sort_order
        boolean is_active
    }
    MENU_ITEM_MODIFIERS {
        int id PK
        int menu_item_id FK
        int modifier_group_id FK
        int sort_order
    }
    RECIPES {
        int id PK
        int menu_item_id FK
        string name
        decimal yield_qty
        boolean is_active
    }
    RECIPE_LINES {
        int id PK
        int recipe_id FK
        int material_id FK "global material"
        decimal quantity
        int uom_id FK
    }

    LOCATIONS ||--o{ MENU_CATEGORIES : "owns"
    LOCATIONS ||--o{ MENU_ITEMS : "sells"
    LOCATIONS ||--o{ MODIFIER_GROUPS : "defines"
    MENU_CATEGORIES ||--o{ MENU_ITEMS : "groups"
    MODIFIER_GROUPS ||--|{ MODIFIER_OPTIONS : "contains"
    MENU_ITEMS ||--o{ MENU_ITEM_MODIFIERS : "has"
    MODIFIER_GROUPS ||--o{ MENU_ITEM_MODIFIERS : "applied to"
    MENU_ITEMS ||--o| RECIPES : "produced by"
    RECIPES ||--|{ RECIPE_LINES : "ingredients"
```

[Open/Edit diagram](https://l.mermaid.ai/5FIXPR)

## Diagram

```
[menu_categories]
  PK id
  FK location_id ────── locations
  -- name
  FK parent_id - - → self
  -- sort_order


[menu_items]
  PK id
  FK location_id ────── locations
  UK (location_id, sku)
  -- sku
  -- name
  FK category_id - - → menu_categories
  -- base_price numeric(18,2)
  -- status (active/inactive)
  -- image_url
  -- audit stamps


[modifier_groups]                [modifier_options]
  PK id                            PK id
  FK location_id ── locations      FK group_id ────── modifier_groups
  -- name                          -- name
  -- selection_type (single/       -- price_adjustment numeric(18,2)
       multiple)                   -- is_default
  -- is_required                   -- sort_order
  -- min_select                    -- is_active
  -- max_select


[menu_item_modifiers]
  PK id
  FK menu_item_id ────── menu_items
  FK modifier_group_id ── modifier_groups
  -- sort_order
  UK (menu_item_id, modifier_group_id)


[recipes]                        [recipe_lines]
  PK id                            PK id
  FK menu_item_id ── menu_items    FK recipe_id ────── recipes
  -- name                          FK material_id ──── materials (global)
  -- yield_qty numeric(18,6)       -- quantity numeric(18,6)
  -- is_active                     FK uom_id ────────── uoms
  -- audit stamps
```

## Notes

- Menu items scoped to location. SKU unique within a location.
- Modifier groups are per-location, reusable across items in same location.
- `menu_item_modifiers` is the M:N join between items and groups.
- Recipes reference global materials (enabling cross-location cost analysis).
- One active recipe per menu item (Phase 1).

---

**Next:** [pos.md](./pos.md) — Orders, Payments, Shifts.
