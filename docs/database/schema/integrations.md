# Schema: Integrations (Moka)

Source: `moka.ts`, `recipe.ts`, `production.ts`

---

## `recipes` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| material_id | int | YES | | FK→materials (cascade). XOR |
| product_id | int | YES | | FK→products (cascade). XOR |
| product_variant_id | int | YES | | FK→variants (cascade). XOR |
| name | text | YES | | |
| target_qty | numeric(18,6) | NO | 1 | > 0 |
| target_uom_id | int | NO | | FK→uoms (restrict) |
| instructions | text | YES | | |
| is_active | boolean | NO | true | |

Check: exactly one of material/product/variant_id is NOT NULL.

## `recipe_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| recipe_id | int | NO | | FK→recipes (cascade) |
| material_id | int | NO | | FK→materials (restrict) |
| qty | numeric(18,6) | NO | | > 0 |
| uom_id | int | NO | | FK→uoms (restrict) |
| scrap_percentage | numeric(5,2) | NO | 0 | [0, 100) |
| sort_order | int | NO | 0 | |
| notes | text | YES | | |

Unique: `(recipe_id, material_id)`

## `work_orders` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| recipe_id | int | NO | | FK→recipes (restrict) |
| location_id | int | NO | | FK→locations (restrict) |
| status | enum | NO | draft | draft / in_progress / completed / cancelled |
| expected_qty | numeric(18,6) | NO | | > 0 |
| actual_qty | numeric(18,6) | NO | 0 | >= 0 |
| note | text | YES | | |
| total_cost | numeric(18,2) | NO | 0 | >= 0 |
| started_at | timestamptz | YES | | |
| completed_at | timestamptz | YES | | |

## `moka_configurations` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| location_id | int | NO | | FK→locations (cascade) |
| provider | enum | NO | moka | |
| email | text | NO | | |
| password | text | NO | | |
| business_id | text | YES | | |
| outlet_id | text | YES | | |
| access_token | text | YES | | |
| is_active | boolean | NO | true | |
| sales_cron_enabled | boolean | NO | false | |
| sales_cron_expression | text | YES | | |
| last_synced_at | timestamptz | YES | | |
| last_sales_synced_at | timestamptz | YES | | |
| last_product_synced_at | timestamptz | YES | | |
| last_category_synced_at | timestamptz | YES | | |

Unique: `(provider, location_id)`

## `moka_scrap_histories` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| moka_configuration_id | int | NO | | FK→moka_configurations (cascade) |
| provider | enum | NO | moka | |
| type | enum | NO | | sales / product / category |
| trigger_mode | enum | NO | manual | manual / cron / upload / machine_fetch |
| status | enum | NO | pending | pending / processing / completed / failed |
| date_from | timestamptz | NO | | |
| date_to | timestamptz | NO | | |
| started_at | timestamptz | YES | | |
| finished_at | timestamptz | YES | | |
| records_count | int | NO | 0 | |
| raw_path | text | YES | | |
| error_message | text | YES | | |
| metadata | jsonb | YES | | |

## `moka_sync_cursors` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| moka_configuration_id | int | NO | | FK→moka_configurations (cascade) |
| type | enum | NO | | sales / product / category |
| provider | enum | NO | moka | |
| cursor_date | timestamptz | YES | | |
| cursor_token | text | YES | | |
| last_history_id | int | YES | | FK→scrap_histories (set null) |

Unique: `(moka_configuration_id, type)`
