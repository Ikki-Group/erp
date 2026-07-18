# Schema: Sales

Source: `sales.ts`

---

## `sales_orders` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| location_id | int | NO | | FK→locations (restrict) |
| customer_id | int | YES | | FK→customers (set null) |
| sales_type_id | int | NO | | FK→sales_types (restrict) |
| source | enum | NO | web | web / moka / upload / machine_fetch |
| status | enum | NO | open | open / closed / void |
| transaction_date | timestamptz | NO | now() | |
| total_amount | numeric(18,2) | NO | 0 | >= 0 |
| discount_amount | numeric(18,2) | NO | 0 | >= 0 |
| tax_amount | numeric(18,2) | NO | 0 | >= 0 |
| gratuity_amount | numeric(18,2) | NO | 0 | >= 0 |
| refund_amount | numeric(18,2) | NO | 0 | >= 0 |
| metadata | jsonb | YES | | third-party data |

## `sales_order_batches` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→sales_orders (cascade) |
| batch_number | numeric(5,0) | NO | | |
| status | enum | NO | pending | pending / prepared / delivered / cancelled |

## `sales_order_items` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→sales_orders (cascade) |
| batch_id | int | YES | | FK→batches (set null) |
| product_id | int | YES | | FK→products (set null) |
| variant_id | int | YES | | FK→product_variants (set null) |
| item_name | text | NO | | immutable |
| quantity | numeric(18,6) | NO | 1 | > 0 |
| unit_price | numeric(18,2) | NO | 0 | >= 0 |
| discount_amount | numeric(18,2) | NO | 0 | >= 0 |
| tax_amount | numeric(18,2) | NO | 0 | >= 0 |
| subtotal | numeric(18,2) | NO | 0 | >= 0 |

## `sales_voids` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→sales_orders (cascade) |
| item_id | int | YES | | FK→items (cascade). Null = whole order |
| reason | text | YES | | |
| voided_by | int | YES | | FK→users (set null) |
| metadata | jsonb | YES | | |

## `sales_refunds` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→sales_orders (cascade) |
| item_id | int | YES | | FK→items (cascade). Null = order-level |
| amount | numeric(18,2) | NO | | > 0 |
| reason | text | YES | | |
| refunded_by | int | YES | | FK→users (set null) |
| refunded_at | timestamptz | NO | | |
| metadata | jsonb | YES | | |

## `sales_external_refs` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→sales_orders (cascade) |
| external_source | text | NO | | Grab, Shopee, Moka |
| external_order_id | text | NO | | |
| raw_payload | jsonb | YES | | |

Unique: `(external_source, external_order_id)`

## `sales_invoices` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→sales_orders (restrict) |
| customer_id | int | YES | | FK→customers (set null) |
| location_id | int | NO | | FK→locations (restrict) |
| status | enum | NO | draft | draft / open / paid / void |
| invoice_date | timestamptz | NO | now() | |
| due_date | timestamptz | YES | | |
| total_amount | numeric(18,2) | NO | 0 | >= 0 |
| tax_amount | numeric(18,2) | NO | 0 | >= 0 |
| discount_amount | numeric(18,2) | NO | 0 | >= 0 |
| notes | text | YES | | |

## `sales_invoice_items` (AB)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| invoice_id | int | NO | | FK→sales_invoices (cascade) |
| sales_order_item_id | int | YES | | FK→order_items (set null) |
| product_id | int | YES | | FK→products (set null) |
| variant_id | int | YES | | FK→variants (set null) |
| item_name | text | NO | | |
| quantity | numeric(18,6) | NO | 0 | > 0 |
| unit_price | numeric(18,2) | NO | 0 | >= 0 |
| tax_amount | numeric(18,2) | NO | 0 | >= 0 |
| discount_amount | numeric(18,2) | NO | 0 | >= 0 |
| subtotal | numeric(18,2) | NO | 0 | >= 0 |
