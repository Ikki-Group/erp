# ERD: Integrations (Moka POS)

```
[moka_configurations]                [moka_scrap_histories]
+-------------------------+          +------------------------+
| PK id                   |--||--o{--| PK id                  |
| * FK location_id        |          | * FK moka_config_id    |
| * provider (moka)       |          | * type (sales/product/category) |
| * email / password      |          | * trigger_mode (manual/cron/upload/machine_fetch) |
|   business_id, outlet_id|          | * status (pending→completed/failed) |
|   access_token          |          | * date_from / date_to  |
| * is_active             |          |   started/finished_at  |
| * sales_cron_enabled    |          | * records_count        |
|   last_synced_at (x4)   |          |   raw_path, error_msg  |
+-------------------------+          +------------------------+
  (unique: provider+location)
        |
[moka_sync_cursors]
+------------------------+
| PK id                  |
| * FK moka_config_id    |
| * type (sales/product/category) |
|   cursor_date          |
|   cursor_token         |
|   FK last_history_id   |
+------------------------+
  (unique: config+type)
```

## Sync Flow

```
moka_configurations (credentials)
    → moka_scrap_histories (job tracking)
    → products / sales_orders created
    → moka_sync_cursors updated (checkpoint)
```

## Key Rules

- One config per provider per location.
- Cursors track incremental sync position per data type.
- Scrap histories provide full audit trail of sync operations.
- Sales imported from Moka get `source='moka'` or `source='machine_fetch'`.
