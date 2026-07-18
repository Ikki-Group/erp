# Schema: Materials

Source: `material.ts`

---

## `material_categories` (AB)

| Column      | Type   | Null | Default | Notes  |
| ----------- | ------ | ---- | ------- | ------ |
| id          | serial | NO   |         | PK     |
| code        | text   | NO   |         | unique |
| name        | text   | NO   |         | unique |
| description | text   | YES  |         |        |

## `materials` (AB)

| Column      | Type    | Null | Default | Notes                                     |
| ----------- | ------- | ---- | ------- | ----------------------------------------- |
| id          | serial  | NO   |         | PK                                        |
| sku         | text    | NO   |         | unique (partial: isActive=true)           |
| name        | text    | NO   |         | unique with type (partial: isActive=true) |
| type        | enum    | NO   |         | raw / semi / packaging                    |
| description | text    | YES  |         |                                           |
| category_id | int     | NO   |         | FK→material_categories (restrict)         |
| base_uom_id | int     | NO   |         | FK→uoms (restrict)                        |
| is_active   | boolean | NO   | true    |                                           |

## `material_conversions` (AB)

| Column         | Type          | Null | Default | Notes                  |
| -------------- | ------------- | ---- | ------- | ---------------------- |
| id             | serial        | NO   |         | PK                     |
| material_id    | int           | NO   |         | FK→materials (cascade) |
| uom_id         | int           | NO   |         | FK→uoms (restrict)     |
| to_base_factor | numeric(18,6) | NO   |         | check: > 0             |
| is_active      | boolean       | NO   | true    |                        |

Unique: `(material_id, uom_id)`

## `material_locations` (AB)

| Column        | Type          | Null | Default | Notes                   |
| ------------- | ------------- | ---- | ------- | ----------------------- |
| id            | serial        | NO   |         | PK                      |
| material_id   | int           | NO   |         | FK→materials (cascade)  |
| location_id   | int           | NO   |         | FK→locations (restrict) |
| min_stock     | numeric(18,6) | NO   | 0       |                         |
| max_stock     | numeric(18,6) | YES  |         | null = uncapped         |
| reorder_point | numeric(18,6) | NO   | 0       |                         |

Unique: `(material_id, location_id)`. Check: max_stock set → min ≤ reorder ≤ max.

## `material_stock_snapshots` (no audit — projection)

| Column              | Type          | Null | Default | Notes                   |
| ------------------- | ------------- | ---- | ------- | ----------------------- |
| id                  | serial        | NO   |         | PK                      |
| material_id         | int           | NO   |         | FK→materials (cascade)  |
| location_id         | int           | NO   |         | FK→locations (restrict) |
| current_qty         | numeric(18,6) | NO   | 0       | check: >= 0             |
| current_avg_cost    | numeric(18,6) | NO   | 0       | check: >= 0             |
| current_value       | numeric(18,6) | NO   | 0       | check: >= 0             |
| snapshot_at         | timestamptz   | NO   | now()   | last recalculation      |
| version             | int           | NO   | 0       | optimistic concurrency  |
| last_transaction_id | int           | YES  |         | last applied stock_txn  |

Unique: `(material_id, location_id)`
