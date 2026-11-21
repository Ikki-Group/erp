# ERD: Core

Locations, IAM, Sessions, Company Settings, Audit Logs.

## Mermaid

```mermaid
erDiagram
    LOCATIONS {
        serial id PK
        varchar code UK
        varchar name
        enum type "store | warehouse"
        varchar address
        varchar phone
        integer is_active "1/0"
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    ROLES {
        serial id PK
        varchar code UK
        varchar name
        integer is_system "1/0"
        jsonb permissions
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    USERS {
        serial id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar name
        integer is_active "1/0"
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    USER_ASSIGNMENTS {
        serial id PK
        integer user_id FK
        integer role_id FK
        integer location_id FK "nullable for global"
    }
    SESSIONS {
        varchar id PK
        integer user_id FK
        integer location_id "active context"
        timestamptz expires_at
    }
    COMPANY_SETTINGS {
        serial id PK
        varchar name
        varchar address
        varchar phone
        varchar email
        varchar tax_id
        numeric tax_rate "precision 5,2"
        varchar currency_code
        varchar currency_symbol
        varchar logo_url
        varchar receipt_footer
        timestamptz created_at
        timestamptz updated_at
        integer created_by
        integer updated_by
    }
    AUDIT_LOGS {
        serial id PK
        timestamptz timestamp
        integer user_id FK
        varchar user_name
        integer location_id FK
        varchar module
        varchar entity
        integer entity_id
        varchar action
        varchar summary
        jsonb old_values
        jsonb new_values
        jsonb metadata
    }

    USERS ||--o{ USER_ASSIGNMENTS : "has"
    ROLES ||--o{ USER_ASSIGNMENTS : "assigned via"
    LOCATIONS |o--o{ USER_ASSIGNMENTS : "scoped to"
    USERS ||--o{ SESSIONS : "has"
    LOCATIONS |o--o{ SESSIONS : "active context"
    USERS ||--o{ AUDIT_LOGS : "performed by"
    LOCATIONS |o--o{ AUDIT_LOGS : "at"
```

## Diagram

```
[locations]
  PK id serial
  UK code varchar(50)
  -- name varchar(255)
  -- type enum (store/warehouse)
  -- address varchar(500)
  -- phone varchar(50)
  -- is_active integer (1/0), default 1
  -- audit stamps


[roles]                          [users]
  PK id serial                     PK id serial
  UK code varchar(50)              UK username varchar(100)
  -- name varchar(255)             UK email varchar(255)
  -- is_system integer (1/0)       -- password_hash varchar(500)
  -- permissions jsonb             -- name varchar(255)
  -- audit stamps                  -- is_active integer (1/0), default 1
                                   -- audit stamps

        [user_assignments]
          PK id serial
          FK user_id ────── users (CASCADE)
          FK role_id ────── roles (RESTRICT)
          FK location_id - - → locations (SET NULL, nullable for global)
          UK (user_id, role_id, location_id)


[sessions]
  PK id varchar(255) (token string)
  FK user_id ────── users (CASCADE)
  -- location_id integer (active context)
  -- expires_at timestamptz


[company_settings]
  PK id serial (singleton = 1)
  -- name varchar(255)
  -- address varchar(500)
  -- phone varchar(50)
  -- email varchar(255)
  -- tax_id varchar(100)
  -- tax_rate numeric(5,2), default '0'
  -- currency_code varchar(10), default 'IDR'
  -- currency_symbol varchar(10), default 'Rp'
  -- logo_url varchar(500)
  -- receipt_footer varchar(1000)
  -- audit stamps


[audit_logs]
  PK id serial
  -- timestamp timestamptz, default now()
  FK user_id ────── users (RESTRICT)
  -- user_name varchar(255)
  FK location_id - - → locations (SET NULL)
  -- module varchar(50)
  -- entity varchar(50)
  -- entity_id integer
  -- action varchar(20)
  -- summary varchar(500)
  -- old_values jsonb
  -- new_values jsonb
  -- metadata jsonb
  IDX (timestamp)
  IDX (entity, entity_id)
  IDX (user_id, timestamp)
  IDX (module, timestamp)
```

## Audit Stamps

All tables with "audit stamps" include:

| Column       | Type        | Notes               |
| ------------ | ----------- | ------------------- |
| `created_at` | timestamptz | default `now()`     |
| `updated_at` | timestamptz | default `now()`     |
| `created_by` | integer     | nullable FK → users |
| `updated_by` | integer     | nullable FK → users |

## Notes

- `locations.type` is a pg enum (`location_type`). Determines available features (store=POS+menu+inventory, warehouse=inventory only).
- `locations.is_active` uses integer (1/0), not native boolean — consistent across all tables.
- `user_assignments.location_id` nullable — global roles (owner, accountant) have null.
- `sessions.location_id` stores active context switcher state.
- `sessions.id` is a varchar PK (token string), not serial.
- `audit_logs` is append-only. Indexes optimize by timestamp, entity, user, and module lookups.

---

**Next:** [master-data.md](./master-data.md) — Materials, UoM, Suppliers.
