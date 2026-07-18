# Schema: Master Data

Source: `location.ts`, `uom.ts`, `tax.ts`, `supplier.ts`, `company.ts`, `sales-type.ts`

---

## `locations` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique |
| name | text | NO | | unique |
| type | enum | NO | | store / warehouse |
| description | text | YES | | |
| address | text | YES | | |
| phone | text | YES | | |
| is_active | boolean | NO | true | |

## `uoms` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique, uppercase |
| name | text | NO | | unique |
| is_system | boolean | NO | false | |

## `taxes` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique (partial: deletedAt IS NULL) |
| name | text | NO | | |
| rate | numeric(5,2) | NO | 0 | check: [0, 100] |
| account_id | int | YES | | FK→accounts (restrict) |
| description | text | YES | | |

## `suppliers` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique (partial: deletedAt IS NULL) |
| name | text | NO | | unique (partial: deletedAt IS NULL) |
| email | text | YES | | |
| phone | text | YES | | |
| address | text | YES | | |
| tax_id | text | YES | | NPWP |

## `company_settings` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| name | text | NO | | |
| address, phone, email | text | YES | | |
| tax_id | text | YES | | NPWP |
| tax_rate | numeric(5,2) | NO | 0 | check: [0, 100] |
| logo_url | text | YES | | |
| invoice_footer | text | YES | | |
| receipt_footer | text | YES | | |
| currency_code | text | NO | IDR | |
| currency_symbol | text | NO | Rp | |
| settings | jsonb | YES | | extensible |

## `sales_types` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| location_id | int | YES | | FK→locations (restrict). Null = global |
| code | text | NO | | unique per scope |
| name | text | NO | | unique per scope |
| is_system | boolean | NO | false | check: isSystem → locationId IS NULL |
