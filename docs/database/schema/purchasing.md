# Schema: Purchasing

Source: `purchasing.ts`

---

## `purchase_requests` (AF) — schema-only

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| location_id | int | NO | | FK→locations (restrict) |
| requested_by | int | NO | | user id |
| status | enum | NO | open | open / approved / rejected / void |
| request_date | timestamptz | NO | now() | |
| expected_date | timestamptz | YES | | |
| notes | text | YES | | |

## `purchase_request_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| request_id | int | NO | | FK→purchase_requests (cascade) |
| material_id | int | YES | | FK→materials (set null) |
| item_name | text | NO | | |
| quantity | numeric(18,6) | NO | 1 | > 0 |
| notes | text | YES | | |

## `purchase_orders` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| request_id | int | YES | | FK→purchase_requests (set null) |
| location_id | int | NO | | FK→locations (restrict) |
| supplier_id | int | NO | | FK→suppliers (restrict) |
| status | enum | NO | open | pending_approval/approved/rejected/open/closed/void |
| transaction_date | timestamptz | NO | now() | |
| expected_delivery_date | timestamptz | YES | | |
| total_amount | numeric(18,2) | NO | 0 | >= 0 |
| discount_amount | numeric(18,2) | NO | 0 | >= 0 |
| tax_amount | numeric(18,2) | NO | 0 | >= 0 |
| notes | text | YES | | |

## `purchase_order_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→purchase_orders (cascade) |
| request_item_id | int | YES | | FK→request_items (set null) |
| material_id | int | YES | | FK→materials (set null) |
| item_name | text | NO | | immutable |
| quantity | numeric(18,6) | NO | 1 | > 0 |
| unit_price | numeric(18,2) | NO | 0 | >= 0 |
| discount_amount | numeric(18,2) | NO | 0 | >= 0 |
| tax_amount | numeric(18,2) | NO | 0 | >= 0 |
| subtotal | numeric(18,2) | NO | 0 | >= 0 |

## `goods_receipt_notes` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→purchase_orders (restrict) |
| location_id | int | NO | | FK→locations (restrict) |
| supplier_id | int | NO | | FK→suppliers (restrict) |
| receive_date | timestamptz | NO | now() | |
| status | enum | NO | open | open / completed / void |
| reference_number | text | YES | | |
| notes | text | YES | | |

## `goods_receipt_note_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| grn_id | int | NO | | FK→goods_receipt_notes (cascade) |
| purchase_order_item_id | int | NO | | FK→po_items (restrict) |
| material_id | int | YES | | FK→materials (set null) |
| item_name | text | NO | | |
| quantity_received | numeric(18,6) | NO | 0 | > 0 |
| notes | text | YES | | |

## `purchase_invoices` (AF) — schema-only

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| order_id | int | NO | | FK→purchase_orders (restrict) |
| supplier_id | int | NO | | FK→suppliers (restrict) |
| location_id | int | NO | | FK→locations (restrict) |
| status | enum | NO | draft | draft / open / paid / void |
| invoice_date | timestamptz | NO | now() | |
| due_date | timestamptz | YES | | |
| external_invoice_number | text | YES | | |
| total_amount | numeric(18,2) | NO | 0 | >= 0 |
| tax_amount | numeric(18,2) | NO | 0 | >= 0 |
| discount_amount | numeric(18,2) | NO | 0 | >= 0 |
| notes | text | YES | | |

## `purchase_invoice_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| invoice_id | int | NO | | FK→purchase_invoices (cascade) |
| purchase_order_item_id | int | YES | | FK→po_items (set null) |
| material_id | int | YES | | FK→materials (set null) |
| item_name | text | NO | | |
| quantity | numeric(18,6) | NO | 0 | |
| unit_price | numeric(18,2) | NO | 0 | |
| tax_amount | numeric(18,2) | NO | 0 | |
| discount_amount | numeric(18,2) | NO | 0 | |
| subtotal | numeric(18,2) | NO | 0 | |
