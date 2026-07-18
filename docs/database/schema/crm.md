# Schema: CRM

Source: `crm.ts`

---

## `customers` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique |
| name | text | NO | | unique |
| email | text | YES | | |
| phone | text | YES | | |
| address | text | YES | | |
| tax_id | text | YES | | NPWP |
| date_of_birth | timestamptz | YES | | birthday promos |
| tier | enum | YES | bronze | bronze / silver / gold / platinum |
| points_balance | int | NO | 0 | check: >= 0 |
| total_points_earned | int | NO | 0 | check: >= 0 |
| registered_at | timestamptz | YES | now() | |
| last_visit_at | timestamptz | YES | | |

## `customer_loyalty_transactions` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| customer_id | int | NO | | FK→customers (cascade) |
| type | enum | NO | | earned / redeemed / adjusted / expired |
| points | int | NO | | signed (negative for redeemed) |
| balance_after | int | NO | | check: >= 0 |
| reference_type | text | YES | | e.g., "sales_order" |
| reference_id | int | YES | | |
| description | text | YES | | |
