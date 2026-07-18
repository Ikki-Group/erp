# Schema: Inventory

Source: `inventory.ts`

---

## `stock_batches` (AF) — schema-only

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| material_id | int | NO | | FK→materials (cascade) |
| batch_no | text | NO | | |
| expiry_date | timestamp | YES | | |
| production_date | timestamp | YES | | |
| notes | text | YES | | |

Unique: `(material_id, batch_no)`

## `stock_adjustments` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| location_id | int | NO | | FK→locations (restrict) |
| type | enum | NO | | opname / found / waste / correction |
| adjustment_date | timestamptz | NO | now() | |
| reason | text | YES | | |
| reference_no | text | YES | | |

## `stock_adjustment_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| adjustment_id | int | NO | | FK→stock_adjustments (cascade) |
| material_id | int | NO | | FK→materials (restrict) |
| batch_id | int | YES | | FK→stock_batches (set null) |
| qty_diff | numeric(18,6) | NO | | signed (+found, -waste) |
| unit_cost | numeric(18,2) | NO | | >= 0 |
| notes | text | YES | | |

## `stock_transactions` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| material_id | int | NO | | FK→materials (restrict) |
| location_id | int | NO | | FK→locations (restrict) |
| type | enum | NO | | purchase/transfer_in/out/adjustment/sell/usage/production_in/out |
| date | date | NO | | |
| reference_no | text | NO | | |
| notes | text | YES | | |
| batch_id | int | YES | | FK→stock_batches (set null) |
| qty | numeric(18,6) | NO | | signed |
| unit_cost | numeric(18,2) | NO | | >= 0 |
| total_cost | numeric(18,2) | NO | | >= 0 |
| counterpart_location_id | int | YES | | FK→locations (restrict) |
| transfer_id | int | YES | | |
| running_qty | numeric(18,6) | NO | | snapshot |
| running_avg_cost | numeric(18,2) | NO | | snapshot |

## `stock_summaries` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| material_id | int | NO | | FK→materials (restrict) |
| location_id | int | NO | | FK→locations (restrict) |
| date | date | NO | | |
| opening_qty/cost/value | numeric | NO | 0 | |
| {type}_qty/value (x8) | numeric | NO | 0 | per transaction type |
| closing_qty/cost/value | numeric | NO | 0 | |

Unique: `(material_id, location_id, date)` where deletedAt IS NULL

## `stock_transfers` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| source_location_id | int | NO | | FK→locations (restrict) |
| destination_location_id | int | NO | | FK→locations (restrict) |
| status | text | NO | pending_approval | pending→approved→in_transit→completed |
| transfer_date | timestamptz | NO | | |
| expected_date | timestamptz | YES | | |
| received_date | timestamptz | YES | | |
| reference_no | text | NO | | |
| notes | text | YES | | |
| rejection_reason | text | YES | | |

Check: `source != destination`

## `stock_transfer_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| transfer_id | int | NO | | FK→stock_transfers (cascade) |
| material_id | int | NO | | FK→materials (restrict) |
| item_name | text | NO | | |
| quantity | numeric(18,6) | NO | | > 0 |
| unit_cost | numeric(18,2) | NO | | >= 0 |
| total_cost | numeric(18,2) | NO | | >= 0 |
| notes | text | YES | | |
