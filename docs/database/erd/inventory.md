# ERD: Inventory

Stock Balances, Movements, Transfer Requests, Opname, Receiving.

## Mermaid

```mermaid
erDiagram
    STOCK_BALANCES {
        serial id PK
        integer material_id FK
        integer location_id FK
        numeric quantity "precision 18,6"
        numeric cost_price "precision 18,6 weighted avg"
    }
    STOCK_MOVEMENTS {
        serial id PK
        integer material_id FK
        integer location_id FK
        varchar type "varchar(50)"
        enum direction "in | out"
        numeric quantity "precision 18,6"
        numeric cost_price "precision 18,6"
        varchar reference_type
        integer reference_id
        varchar notes
        timestamptz created_at
        integer created_by FK
    }
    TRANSFER_REQUESTS {
        serial id PK
        varchar transfer_no UK
        integer from_location_id FK
        integer to_location_id FK
        enum status "requested | in_transit | received | cancelled"
        varchar notes
        integer requested_by FK
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    TRANSFER_LINES {
        serial id PK
        integer transfer_id FK
        integer material_id FK
        numeric requested_qty "precision 18,6"
        numeric shipped_qty "nullable"
        numeric received_qty "nullable"
        integer uom_id FK
    }
    STOCK_OPNAMES {
        serial id PK
        varchar opname_no UK
        integer location_id FK
        enum status "draft | in_progress | completed | cancelled"
        timestamptz started_at
        timestamptz completed_at
        integer conducted_by FK
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    STOCK_OPNAME_LINES {
        serial id PK
        integer opname_id FK
        integer material_id FK
        numeric system_qty "precision 18,6"
        numeric actual_qty "precision 18,6"
        varchar reason
    }
    RECEIVINGS {
        serial id PK
        varchar receiving_no UK
        integer location_id FK
        integer supplier_id FK
        enum status "draft | confirmed"
        varchar notes
        integer received_by FK
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    RECEIVING_LINES {
        serial id PK
        integer receiving_id FK
        integer material_id FK
        numeric quantity "precision 18,6"
        numeric unit_cost "precision 18,6"
        integer uom_id FK
    }

    LOCATIONS ||--o{ STOCK_BALANCES : "stores"
    MATERIALS ||--o{ STOCK_BALANCES : "tracked"
    LOCATIONS ||--o{ STOCK_MOVEMENTS : "at"
    MATERIALS ||--o{ STOCK_MOVEMENTS : "of"
    TRANSFER_REQUESTS ||--|{ TRANSFER_LINES : "contains"
    STOCK_OPNAMES ||--|{ STOCK_OPNAME_LINES : "counts"
    RECEIVINGS ||--|{ RECEIVING_LINES : "contains"
```

## Diagram

```
[stock_balances]
  PK id serial
  FK material_id ────── materials (RESTRICT)
  FK location_id ────── locations (RESTRICT)
  -- quantity numeric(18,6), default '0'
  -- cost_price numeric(18,6), default '0' (weighted avg per location)
  UK (material_id, location_id)
  CHECK quantity >= 0
  IDX (material_id)
  IDX (location_id)


[stock_movements]
  PK id serial
  FK material_id ────── materials (RESTRICT)
  FK location_id ────── locations (RESTRICT)
  -- type varchar(50) (receiving/transfer_in/transfer_out/sale/
       adjustment_in/adjustment_out/opname/production_in/production_out)
  -- direction enum (in/out)
  -- quantity numeric(18,6)
  -- cost_price numeric(18,6)
  -- reference_type varchar(50)
  -- reference_id integer
  -- notes varchar(1000)
  -- created_at timestamptz, default now()
  FK created_by - - → users (SET NULL)
  IDX (material_id, location_id, created_at)
  IDX (material_id)
  IDX (location_id)
  IDX (created_by)


[transfer_requests]              [transfer_lines]
  PK id serial                     PK id serial
  UK transfer_no varchar(100)      FK transfer_id ── transfer_requests (CASCADE)
  FK from_location_id ── locations FK material_id ── materials (RESTRICT)
       (RESTRICT)                  -- requested_qty numeric(18,6)
  FK to_location_id ──── locations -- shipped_qty numeric(18,6) nullable
       (RESTRICT)                  -- received_qty numeric(18,6) nullable
  -- status enum (requested/       FK uom_id ────── uoms (RESTRICT)
       in_transit/received/        IDX (transfer_id)
       cancelled)                  IDX (material_id)
  -- notes varchar(1000)           IDX (uom_id)
  FK requested_by - - → users
       (SET NULL)
  -- audit stamps
  CHECK from_location_id != to_location_id
  IDX (from_location_id)
  IDX (to_location_id)
  IDX (requested_by)


[stock_opnames]                  [stock_opname_lines]
  PK id serial                     PK id serial
  UK opname_no varchar(100)        FK opname_id ── stock_opnames (CASCADE)
  FK location_id ────── locations  FK material_id ── materials (RESTRICT)
       (RESTRICT)                  -- system_qty numeric(18,6)
  -- status enum (draft/           -- actual_qty numeric(18,6)
       in_progress/completed/      -- reason varchar(500)
       cancelled)                  IDX (opname_id)
  -- started_at timestamptz        IDX (material_id)
  -- completed_at timestamptz
  FK conducted_by - - → users
       (SET NULL)
  -- audit stamps
  IDX (location_id)
  IDX (conducted_by)


[receivings]                     [receiving_lines]
  PK id serial                     PK id serial
  UK receiving_no varchar(100)     FK receiving_id ── receivings (CASCADE)
  FK location_id ────── locations  FK material_id ─── materials (RESTRICT)
       (RESTRICT)                  -- quantity numeric(18,6)
  FK supplier_id ────── suppliers  -- unit_cost numeric(18,6)
       (RESTRICT)                  FK uom_id ────────── uoms (RESTRICT)
  -- status enum (draft/           IDX (receiving_id)
       confirmed)                  IDX (material_id)
  -- notes varchar(1000)           IDX (uom_id)
  FK received_by - - → users
       (SET NULL)
  -- audit stamps
  IDX (location_id)
  IDX (supplier_id)
  IDX (received_by)
```

## Notes

- `stock_balances` has CHECK qty >= 0. One record per material per location. `cost_price` is the weighted average cost in base UoM for that location.
- `stock_movements` are immutable (append-only audit trail). No audit stamps — only `created_at`/`created_by`.
- `stock_movements.type` is **varchar(50)**, not a pg enum. Known values: `receiving`, `transfer_in`, `transfer_out`, `sale`, `adjustment_in`, `adjustment_out`, `opname`, `production_in`, `production_out`.
- `stock_movements.direction` is a pg enum: `in` or `out`.
- `transfer_requests` has a CHECK constraint ensuring `from_location_id != to_location_id`.
- `receivings.status` is a pg enum with values `draft` and `confirmed`.
- `stock_opname_lines.reason` stores the explanation for any discrepancy.
- `receivings` trigger: stock movement + balance update + cost recalc.

---

**Next:** [production.md](./production.md) — Production Recipes, Production Orders.
