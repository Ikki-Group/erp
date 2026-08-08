# ERD: Menu

Menu Items, Categories, Modifier Groups, Recipes. All **per-location**.

## Mermaid

```mermaid
erDiagram
    MENU_CATEGORIES {
        serial id PK
        integer location_id FK
        varchar name
        integer parent_id FK "self-ref"
        integer sort_order
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    MENU_ITEMS {
        serial id PK
        integer location_id FK
        varchar sku "unique per location"
        varchar name
        integer category_id FK
        numeric base_price "precision 18,2"
        enum status "active | inactive"
        varchar image_url
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    MODIFIER_GROUPS {
        serial id PK
        integer location_id FK
        varchar name
        enum selection_type "single | multiple"
        integer is_required "1/0"
        integer min_select
        integer max_select "nullable"
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    MODIFIER_OPTIONS {
        serial id PK
        integer group_id FK
        varchar name
        numeric price_adjustment "precision 18,2"
        integer is_default "1/0"
        integer sort_order
        integer is_active "1/0"
    }
    MENU_ITEM_MODIFIERS {
        serial id PK
        integer menu_item_id FK
        integer modifier_group_id FK
        integer sort_order
    }
    RECIPES {
        serial id PK
        integer menu_item_id FK
        varchar name
        numeric yield_qty "precision 18,6"
        integer is_active "1/0"
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    RECIPE_LINES {
        serial id PK
        integer recipe_id FK
        integer material_id FK "global material"
        numeric quantity "precision 18,6"
        integer uom_id FK
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

## Diagram

```
[menu_categories]
  PK id serial
  FK location_id ────── locations (CASCADE)
  -- name varchar(255)
  FK parent_id - - → self (self-ref)
  -- sort_order integer, default 0
  -- audit stamps
  IDX (location_id)
  IDX (parent_id)


[menu_items]
  PK id serial
  FK location_id ────── locations (CASCADE)
  UK (location_id, sku)
  -- sku varchar(100)
  -- name varchar(255)
  FK category_id - - → menu_categories (SET NULL)
  -- base_price numeric(18,2)
  -- status enum (active/inactive)
  -- image_url varchar(500)
  -- audit stamps
  IDX (location_id)
  IDX (category_id)


[modifier_groups]                [modifier_options]
  PK id serial                     PK id serial
  FK location_id ── locations      FK group_id ────── modifier_groups
       (CASCADE)                        (CASCADE)
  -- name varchar(255)             -- name varchar(255)
  -- selection_type enum (single/  -- price_adjustment numeric(18,2)
       multiple)                        default '0'
  -- is_required integer (1/0)     -- is_default integer (1/0)
  -- min_select integer, default 0 -- sort_order integer, default 0
  -- max_select integer nullable   -- is_active integer (1/0)
  -- audit stamps                  IDX (group_id)
  IDX (location_id)


[menu_item_modifiers]
  PK id serial
  FK menu_item_id ────── menu_items (CASCADE)
  FK modifier_group_id ── modifier_groups (CASCADE)
  -- sort_order integer, default 0
  UK (menu_item_id, modifier_group_id)
  IDX (menu_item_id)
  IDX (modifier_group_id)


[recipes]                        [recipe_lines]
  PK id serial                     PK id serial
  FK menu_item_id ── menu_items    FK recipe_id ────── recipes (CASCADE)
       (CASCADE)                   FK material_id ──── materials (RESTRICT)
  -- name varchar(255)             -- quantity numeric(18,6)
  -- yield_qty numeric(18,6)       FK uom_id ────────── uoms (RESTRICT)
  -- is_active integer (1/0)       CHECK quantity > 0
  -- audit stamps                  IDX (recipe_id)
  UK (menu_item_id) WHERE            IDX (material_id)
       is_active = 1                 IDX (uom_id)
  IDX (menu_item_id)
```

## Notes

- Menu items scoped to location. SKU unique within a location via composite unique index.
- Modifier groups are per-location, reusable across items in same location.
- `menu_item_modifiers` is the M:N join between items and groups.
- `modifier_options` has no audit stamps — lightweight child table.
- Recipes reference global materials (enabling cross-location cost analysis).
- One active recipe per menu item — enforced via partial unique index `WHERE is_active = 1`.
- `recipe_lines.quantity` has CHECK > 0 constraint.
- `menu_item_status` and `selection_type` are pg enums.

---

**Next:** [pos.md](./pos.md) — Orders, Payments, Shifts.
