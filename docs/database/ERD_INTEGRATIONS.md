# ERD — Integrations

Part of [`docs/database/`](./README.md). Covers `moka.ts`.

> Audit columns omitted for brevity — see [conventions](./SCHEMA_CONVENTIONS.md#audit-columns--soft-delete).
> External entities are shown with only `id`.

## `moka.ts` — third-party POS sync (Moka)

```mermaid
erDiagram
    MOKA_CONFIGURATIONS {
        int id PK
        int location_id FK
        enum provider "moka (single-value enum today)"
        text email
        text password
        text business_id
        text outlet_id
        text access_token
        bool is_active
        bool sales_cron_enabled
        text sales_cron_expression
        timestamp last_synced_at
        timestamp last_sales_synced_at
        timestamp last_product_synced_at
        timestamp last_category_synced_at
    }

    MOKA_SCRAP_HISTORIES {
        int id PK
        int moka_configuration_id FK
        enum provider "moka"
        enum type "sales|product|category"
        enum trigger_mode "manual|cron|upload|machine_fetch"
        enum status "pending|processing|completed|failed"
        timestamp date_from
        timestamp date_to
        timestamp started_at
        timestamp finished_at
        int records_count
        text raw_path
        text error_message
        jsonb metadata
    }

    MOKA_SYNC_CURSORS {
        int id PK
        int moka_configuration_id FK
        enum type "sales|product|category"
        enum provider "moka"
        timestamp cursor_date
        text cursor_token
        int last_history_id FK "nullable, set null"
    }

    LOCATIONS {
        int id PK
    }

    LOCATIONS ||--o{ MOKA_CONFIGURATIONS : "cascade"
    MOKA_CONFIGURATIONS ||--o{ MOKA_SCRAP_HISTORIES : "cascade"
    MOKA_CONFIGURATIONS ||--o{ MOKA_SYNC_CURSORS : "cascade"
    MOKA_SCRAP_HISTORIES ||--o{ MOKA_SYNC_CURSORS : "last_history_id, optional"
```

Notes:

- `provider` is currently a single-value enum (`'moka'` only) on every table
  here — modeled as an enum rather than a hardcoded column specifically so a
  second POS integration can be added later without a column rename, just a
  new enum value.
- `moka_scrap_histories` is the append-only log of each sync run (one row
  per scrape attempt, with status/timing/error); `moka_sync_cursors` is the
  small "where did we leave off" pointer table (one row per
  `(configurationId, type)` pair, upserted) that the next sync run reads
  to resume incrementally instead of re-fetching everything.
- `mokaConfigurations` stores the Moka account **password** in plaintext
  (`password: text('password')`) — this is a third-party credential the app
  needs to replay for scraping, not a user-facing auth credential, but worth
  flagging if this table is ever exposed via an API response without
  explicit field omission.
