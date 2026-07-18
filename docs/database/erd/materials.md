# ERD: Materials

```
[uoms]                              [material_categories]
+------------------+                +------------------+
| PK id            |                | PK id            |
| * code (unique)  |                | * code (unique)  |
| * name (unique)  |                | * name (unique)  |
| * is_system      |                +------------------+
+------------------+                        |
        |                                   |
        +------------------+----------------+
                           |
[materials]                |
+------------------------------+
| PK id                        |
| * sku (unique when active)   |
| * name (unique+type, active) |
| * type (raw/semi/packaging)  |
| * FK category_id ------------+
| * FK base_uom_id --> uoms
| * is_active                  |
+------------------------------+
        |
        +------------------+------------------+------------------+
        |                  |                  |                  |
[material_conversions]  [material_locations]  [material_stock_snapshots]
+------------------+    +------------------+  +---------------------+
| PK id            |    | PK id            |  | PK id               |
| * FK material_id |    | * FK material_id |  | * FK material_id    |
| * FK uom_id      |    | * FK location_id |  | * FK location_id    |
| * to_base_factor |    | * min_stock      |  | * current_qty       |
| * is_active      |    |   max_stock      |  | * current_avg_cost  |
+------------------+    | * reorder_point  |  | * current_value     |
 (unique: mat+uom)      +------------------+  | * snapshot_at       |
                         (unique: mat+loc)     +---------------------+
                                               (unique: mat+loc)
```

## Relationships

| Parent | Child | FK | On Delete |
|--------|-------|-----|-----------|
| materials | material_conversions | material_id | cascade |
| materials | material_locations | material_id | cascade |
| materials | material_stock_snapshots | material_id | cascade |
| material_categories | materials | category_id | restrict |
| uoms | materials | base_uom_id | restrict |
| uoms | material_conversions | uom_id | restrict |
| locations | material_locations | location_id | restrict |
| locations | material_stock_snapshots | location_id | restrict |

## Key Constraints

- `to_base_factor > 0` (conversion must be positive)
- `current_qty >= 0` (physical stock cannot be negative)
- When `max_stock` is set: `min_stock <= reorder_point <= max_stock`
