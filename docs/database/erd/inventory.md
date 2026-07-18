# ERD: Inventory

```
[stock_transactions]
+-----------------------------+
| PK id                       |
| * FK material_id (restrict) |
| * FK location_id (restrict) |
| * type (purchase/transfer_in/out/adjustment/sell/usage/production_in/out) |
| * date, reference_no        |
|   FK batch_id               |
| * qty (signed)              |
| * unit_cost >= 0            |
| * total_cost >= 0           |
|   FK counterpart_location   |
|   transfer_id               |
| * running_qty, running_avg_cost (snapshot) |
+-----------------------------+

[stock_adjustments]              [stock_adjustment_items]
+---------------------+          +---------------------+
| PK id               |--||--o{--| PK id               |
| * FK location_id    |          | * FK adjustment_id  |
| * type (opname/found/waste/correction) | | * FK material_id  |
| * adjustment_date   |          |   FK batch_id       |
+---------------------+          | * qty_diff (signed) |
                                 | * unit_cost >= 0    |
                                 +---------------------+

[stock_transfers]                [stock_transfer_items]
+---------------------+          +---------------------+
| PK id               |--||--o{--| PK id               |
| * FK source_loc     |          | * FK transfer_id    |
| * FK dest_loc       |          | * FK material_id    |
| * status (pending→completed)   | * quantity > 0      |
| * transfer_date     |          | * unit/total_cost>=0|
| * reference_no      |          +---------------------+
+---------------------+
  (check: src != dest)

[stock_summaries]                [stock_batches]
+---------------------------+    +------------------+
| PK id                     |    | PK id            |
| * FK material_id          |    | * FK material_id |
| * FK location_id          |    | * batch_no       |
| * date                    |    |   expiry_date    |
| * opening/closing qty+cost|    +------------------+
| * per-type qty+value      |     (unique: mat+batch_no)
+---------------------------+     (schema-only)
 (unique: mat+loc+date)
```

## Costing: Weighted Average

```
new_avg = (old_qty * old_avg + new_qty * new_price) / (old_qty + new_qty)
```

Stored in: `stock_transactions.running_avg_cost`, `material_stock_snapshots.current_avg_cost`, `stock_summaries.closing_avg_cost`
