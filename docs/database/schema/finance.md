# Schema: Finance & Payments

Source: `finance.ts`, `payment.ts`

---

## `accounts` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique (partial: deletedAt IS NULL) |
| name | text | NO | | |
| type | enum | NO | | ASSET / LIABILITY / EQUITY / REVENUE / EXPENSE |
| is_group | boolean | NO | false | tree node vs leaf |
| parent_id | int | YES | | FK→accounts (self, restrict) |

## `journal_entries` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| date | timestamptz | NO | now() | |
| reference | text | NO | | |
| source_type | text | NO | | sales / payroll / purchasing / production |
| source_id | int | NO | | |
| note | text | YES | | |

## `journal_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| journal_entry_id | int | NO | | FK→journal_entries (cascade) |
| account_id | int | NO | | FK→accounts |
| debit | numeric(18,2) | NO | 0 | >= 0 |
| credit | numeric(18,2) | NO | 0 | >= 0 |

## `expenditures` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| type | enum | NO | | BILLS / ASSET / PURCHASES |
| status | enum | NO | PAID | PENDING / PAID / VOID / REFUNDED |
| title | text | NO | | |
| description | text | YES | | |
| date | timestamptz | NO | now() | |
| amount | numeric(18,2) | NO | 0 | > 0 |
| source_account_id | int | NO | | FK→accounts |
| target_account_id | int | NO | | FK→accounts |
| liability_account_id | int | YES | | FK→accounts |
| supplier_id | int | YES | | FK→suppliers |
| location_id | int | NO | | FK→locations |
| is_installment | boolean | NO | false | |

## `payment_providers` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique |
| name | text | NO | | |
| description | text | YES | | |
| website_url | text | YES | | |
| is_active | boolean | NO | true | |
| is_system | boolean | NO | false | |

## `payment_methods` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| type | enum | NO | | cash/bank_transfer/credit_card/debit_card/e_wallet |
| category | enum | NO | | cash / cashless |
| name | text | NO | | |
| is_enabled | boolean | NO | true | |
| is_default | boolean | NO | false | |
| is_global | boolean | NO | false | |
| payment_provider_id | int | YES | | FK→providers (set null) |

## `location_payment_methods` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| location_id | int | NO | | FK→locations (cascade) |
| payment_method_id | int | NO | | FK→payment_methods (cascade) |
| payment_provider_id | int | YES | | FK→providers (set null) |
| is_enabled | boolean | NO | true | |
| is_default | boolean | NO | false | |
| credentials | jsonb | YES | | merchant secrets |
| config | jsonb | YES | | fees, limits |
| enabled_at | timestamptz | YES | | |

## `payments` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| type | enum | NO | | payable / receivable |
| date | timestamptz | NO | now() | |
| reference_no | text | YES | | |
| account_id | int | NO | | FK→accounts (restrict) |
| method | enum | NO | | payment method type |
| amount | numeric(18,2) | NO | 0 | > 0 |
| notes | text | YES | | |

## `payment_invoices` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| payment_id | int | NO | | FK→payments (cascade) |
| sales_invoice_id | int | YES | | FK→sales_invoices (cascade) |
| purchase_invoice_id | int | YES | | FK→purchase_invoices (cascade) |
| amount | numeric(18,2) | NO | | > 0 |
