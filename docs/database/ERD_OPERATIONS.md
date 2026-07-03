# ERD — Operations

Part of [`docs/database/`](./README.md). Covers `crm.ts`, `hr.ts`,
`finance.ts`, `payment.ts`, `inventory.ts`, `purchasing.ts`, `production.ts`,
`recipe.ts`, `sales.ts`.

> Audit columns omitted for brevity — see [conventions](./SCHEMA_CONVENTIONS.md#audit-columns--soft-delete).
> External entities are shown with only `id`.

## `crm.ts` — customers, customer_loyalty_transactions

```mermaid
erDiagram
    CUSTOMERS {
        int id PK
        text code UK
        text name UK
        text email
        text phone
        text address
        text tax_id
        timestamp date_of_birth
        enum tier "bronze|silver|gold|platinum, nullable"
        int points_balance
        int total_points_earned
        timestamp registered_at
        timestamp last_visit_at
    }

    CUSTOMER_LOYALTY_TRANSACTIONS {
        int id PK
        int customer_id FK
        enum type "earned|redeemed|adjusted|expired"
        int points
        int balance_after
        text reference_type
        int reference_id
        text description
    }

    CUSTOMERS ||--o{ CUSTOMER_LOYALTY_TRANSACTIONS : "cascade"
```

Notes:

- `pointsBalance` on `customers` is a denormalized running total;
  `customer_loyalty_transactions.balanceAfter` is the append-only audit
  trail it was derived from — see [cache-friendliness](./SCHEMA_CONVENTIONS.md#cache-friendliness).
- File is named `crm.ts` (not `customer.ts`) to match the owning module
  `modules/crm/` — table export names (`customersTable`, ...) are unchanged.

## `hr.ts` — employees, shifts, attendances, payroll, leave requests

```mermaid
erDiagram
    EMPLOYEES {
        int id PK
        text code UK
        text name
        text email
        text phone
        text address
        text nik
        text npwp
        text job_title
        text department
        numeric base_salary
        text bank_account
        timestamp hire_date
        timestamp termination_date
        text emergency_contact
        int user_id FK "nullable, set null"
    }

    SHIFTS {
        int id PK
        text name
        time start_time
        time end_time
        text note
    }

    ATTENDANCES {
        int id PK
        int employee_id FK
        int location_id FK
        int shift_id FK "nullable, set null"
        timestamp date
        timestamp clock_in
        timestamp clock_out
        enum status "present|absent|late|on_leave"
        text note
    }

    PAYROLL_BATCHES {
        int id PK
        text name
        int period_month
        int period_year
        enum status "draft|approved|paid|cancelled"
        numeric total_amount
        text note
    }

    PAYROLL_ITEMS {
        int id PK
        int batch_id FK
        int employee_id FK
        numeric base_salary
        numeric adjustments_amount
        numeric service_charge_amount
        numeric total_amount
        text note
    }

    PAYROLL_ADJUSTMENTS {
        int id PK
        int payroll_item_id FK
        enum type "addition|deduction"
        numeric amount
        text reason
    }

    LEAVE_REQUESTS {
        int id PK
        int employee_id FK
        enum type "annual|sick|unpaid|other"
        enum status "pending|approved|rejected|cancelled"
        timestamp date_start
        timestamp date_end
        text reason
        text note
    }

    USERS {
        int id PK
    }

    LOCATIONS {
        int id PK
    }

    USERS ||--o{ EMPLOYEES : "optional link, set null"
    EMPLOYEES ||--o{ ATTENDANCES : "restrict"
    LOCATIONS ||--o{ ATTENDANCES : "restrict"
    SHIFTS ||--o{ ATTENDANCES : "optional, set null"
    PAYROLL_BATCHES ||--o{ PAYROLL_ITEMS : "cascade"
    EMPLOYEES ||--o{ PAYROLL_ITEMS : "restrict"
    PAYROLL_ITEMS ||--o{ PAYROLL_ADJUSTMENTS : "cascade"
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "cascade"
```

Notes:

- `shiftsTable`/`attendancesTable` correspond to the `modules/hr/hr`
  submodule (an unfortunately generic submodule name — flagged as a
  candidate rename, not yet done).
- `employees.userId` links an employee record to a system login (`users`) —
  optional; not every employee needs system access, and not every user is
  an employee (e.g. root/system accounts).

## `finance.ts` — accounts, journal entries, expenditures

```mermaid
erDiagram
    ACCOUNTS {
        int id PK
        text code UK
        text name
        enum type "ASSET|LIABILITY|EQUITY|REVENUE|EXPENSE"
        bool is_group
        int parent_id FK "self-reference, nullable, restrict"
    }

    JOURNAL_ENTRIES {
        int id PK
        timestamp date
        text reference
        text source_type "polymorphic, no FK"
        int source_id "polymorphic, no FK"
        text note
    }

    JOURNAL_ITEMS {
        int id PK
        int journal_entry_id FK
        int account_id FK
        numeric debit
        numeric credit
    }

    EXPENDITURES {
        int id PK
        enum type "BILLS|ASSET|PURCHASES"
        enum status "PENDING|PAID|VOID|REFUNDED"
        text title
        text description
        timestamp date
        numeric amount
        int source_account_id FK
        int target_account_id FK
        int liability_account_id FK "nullable"
        int supplier_id FK "nullable"
        int location_id FK
        bool is_installment
    }

    SUPPLIERS {
        int id PK
    }

    LOCATIONS {
        int id PK
    }

    ACCOUNTS ||--o{ ACCOUNTS : "parent_id (chart of accounts tree)"
    JOURNAL_ENTRIES ||--o{ JOURNAL_ITEMS : "cascade"
    ACCOUNTS ||--o{ JOURNAL_ITEMS : "posts to"
    ACCOUNTS ||--o{ EXPENDITURES : "source_account_id"
    ACCOUNTS ||--o{ EXPENDITURES : "target_account_id"
    ACCOUNTS ||--o{ EXPENDITURES : "liability_account_id (optional)"
    SUPPLIERS ||--o{ EXPENDITURES : "optional"
    LOCATIONS ||--o{ EXPENDITURES : "required"
```

Notes:

- `journalEntries.sourceType`/`sourceId` is a polymorphic soft-reference
  (`'sales'`, `'payroll'`, `'purchasing'`, `'production'`, ...) — deliberately
  not a real FK since it can point at rows in any of several tables.
- `expenditures` has **three** account FKs modeling a double/triple-entry-ish
  flow: `sourceAccountId` (where the money comes from — cash/bank),
  `targetAccountId` (where it goes — asset/expense category), optional
  `liabilityAccountId` (for tracking debt/hutang on installment purchases).
- All four expenditure FK columns got dedicated indexes in the last schema
  review — none were covered by an existing composite index, and GL
  drill-down by account/supplier is a common reporting query.

## `payment.ts` — providers, methods, settlement

```mermaid
erDiagram
    PAYMENT_PROVIDERS {
        int id PK
        text code UK
        text name
        text description
        text website_url
        bool is_active
        bool is_system
    }

    PAYMENT_METHODS {
        int id PK
        enum type "cash|bank_transfer|credit_card|debit_card|e_wallet"
        enum category "cash|cashless"
        text name
        bool is_enabled
        bool is_default
        bool is_global
        int payment_provider_id FK "nullable, set null"
    }

    LOCATION_PAYMENT_METHODS {
        int id PK
        int location_id FK
        int payment_method_id FK
        int payment_provider_id FK "nullable"
        bool is_enabled
        bool is_default
        jsonb credentials
        jsonb config
        timestamp enabled_at
    }

    PAYMENTS {
        int id PK
        enum type "payable|receivable"
        timestamp date
        text reference_no
        int account_id FK
        enum method "cash|bank_transfer|credit_card|debit_card|e_wallet"
        numeric amount
        text notes
    }

    PAYMENT_INVOICES {
        int id PK
        int payment_id FK
        int sales_invoice_id FK "nullable, cascade"
        int purchase_invoice_id FK "nullable, cascade"
        numeric amount
    }

    LOCATIONS {
        int id PK
    }

    ACCOUNTS {
        int id PK
    }

    SALES_INVOICES {
        int id PK
    }

    PURCHASE_INVOICES {
        int id PK
    }

    PAYMENT_PROVIDERS ||--o{ PAYMENT_METHODS : "optional"
    LOCATIONS ||--o{ LOCATION_PAYMENT_METHODS : "cascade"
    PAYMENT_METHODS ||--o{ LOCATION_PAYMENT_METHODS : "cascade"
    PAYMENT_PROVIDERS ||--o{ LOCATION_PAYMENT_METHODS : "optional"
    ACCOUNTS ||--o{ PAYMENTS : "restrict"
    PAYMENTS ||--o{ PAYMENT_INVOICES : "cascade"
    SALES_INVOICES ||--o{ PAYMENT_INVOICES : "optional, cascade"
    PURCHASE_INVOICES ||--o{ PAYMENT_INVOICES : "optional, cascade"
```

Notes:

- **Three distinct concepts, easy to conflate**: `payment_methods`
  (which method _types_ are configured — cash, bank transfer, ...),
  `location_payment_methods` (which of those are _enabled per store_, with
  store-specific credentials), `payments`/`payment_invoices` (the actual
  money _movement_ — AR/AP settlement). These used to be split across
  `finance_payment.ts` + 3 other files with `payments` mis-grouped under
  "finance" — fixed during the schema reorganization; owner is
  `modules/payment/payment`, not `modules/finance`.
- `payment_invoices` is the allocation line: one payment can be split across
  multiple invoices (partial payments), and one invoice can receive multiple
  payments over time (installments) — hence the separate join table rather
  than a direct FK on the invoice.

## `inventory.ts` — batches, adjustments, transactions, summaries, transfers

```mermaid
erDiagram
    STOCK_BATCHES {
        int id PK
        int material_id FK
        text batch_no
        timestamp expiry_date
        timestamp production_date
        text notes
    }

    STOCK_ADJUSTMENTS {
        int id PK
        int location_id FK
        enum type "opname|found|waste|correction"
        timestamp adjustment_date
        text reason
        text reference_no
    }

    STOCK_ADJUSTMENT_ITEMS {
        int id PK
        int adjustment_id FK
        int material_id FK
        int batch_id FK "nullable"
        numeric qty_diff "signed: + found, - waste"
        numeric unit_cost
        text notes
    }

    STOCK_TRANSACTIONS {
        int id PK
        int material_id FK
        int location_id FK
        enum type "purchase|transfer_in|transfer_out|adjustment|sell|usage|production_in|production_out"
        date date
        text reference_no
        int batch_id FK "nullable"
        numeric qty
        numeric unit_cost
        numeric total_cost
        int counterpart_location_id FK "nullable, transfer only"
        int transfer_id "polymorphic, no FK"
        numeric running_qty
        numeric running_avg_cost
    }

    STOCK_SUMMARIES {
        int id PK
        int material_id FK
        int location_id FK
        date date
        numeric opening_qty
        numeric closing_qty
        numeric closing_avg_cost
        numeric closing_value
    }

    STOCK_TRANSFERS {
        int id PK
        int source_location_id FK
        int destination_location_id FK "must differ from source"
        text status "pending_approval|approved|rejected|in_transit|completed|cancelled"
        timestamp transfer_date
        timestamp expected_date
        timestamp received_date
        text reference_no
        text notes
        text rejection_reason
    }

    STOCK_TRANSFER_ITEMS {
        int id PK
        int transfer_id FK
        int material_id FK
        text item_name
        numeric quantity
        numeric unit_cost
        numeric total_cost
    }

    MATERIALS {
        int id PK
    }

    LOCATIONS {
        int id PK
    }

    MATERIALS ||--o{ STOCK_BATCHES : "cascade"
    LOCATIONS ||--o{ STOCK_ADJUSTMENTS : "restrict"
    STOCK_ADJUSTMENTS ||--o{ STOCK_ADJUSTMENT_ITEMS : "cascade"
    MATERIALS ||--o{ STOCK_ADJUSTMENT_ITEMS : "restrict"
    STOCK_BATCHES ||--o{ STOCK_ADJUSTMENT_ITEMS : "optional"
    MATERIALS ||--o{ STOCK_TRANSACTIONS : "restrict"
    LOCATIONS ||--o{ STOCK_TRANSACTIONS : "restrict"
    STOCK_BATCHES ||--o{ STOCK_TRANSACTIONS : "optional"
    LOCATIONS ||--o{ STOCK_TRANSACTIONS : "counterpart_location_id, optional"
    MATERIALS ||--o{ STOCK_SUMMARIES : "restrict"
    LOCATIONS ||--o{ STOCK_SUMMARIES : "restrict"
    LOCATIONS ||--o{ STOCK_TRANSFERS : "source, restrict"
    LOCATIONS ||--o{ STOCK_TRANSFERS : "destination, restrict"
    STOCK_TRANSFERS ||--o{ STOCK_TRANSFER_ITEMS : "cascade"
    MATERIALS ||--o{ STOCK_TRANSFER_ITEMS : "restrict"
```

Notes:

- `stockTransactions` is the append-only event log; `stockSummaries` is the
  daily-rollup projection; `material.materialStockSnapshots` (see
  [`02-master-data.md`](./ERD_MASTER_DATA.md)) is the current-state
  projection. Three different granularities of the same underlying stock
  movement facts — this is intentional, not duplication: event log for
  audit/recompute, daily summary for reporting, live snapshot for
  fast "how much do we have right now" reads.
- `stockTransactions.transferId` is a plain `integer`, **not** an FK to
  `stock_transfers.id` — same polymorphic-soft-reference pattern as
  `journalEntries.sourceId`.
- `stockBatchesTable` (lot/expiry tracking) is schema-complete but has zero
  reads/writes from any repo/service today — same "ahead of the module
  layer" situation as the unimplemented `purchasing.ts` tables below.

## `purchasing.ts` — request → order → receipt → invoice

```mermaid
erDiagram
    PURCHASE_REQUESTS {
        int id PK
        int location_id FK
        int requested_by "no FK, soft reference to users"
        enum status "open|approved|rejected|void"
        timestamp request_date
        timestamp expected_date
        text notes
    }

    PURCHASE_REQUEST_ITEMS {
        int id PK
        int request_id FK
        int material_id FK "nullable"
        text item_name
        numeric quantity
        text notes
    }

    PURCHASE_ORDERS {
        int id PK
        int request_id FK "nullable, optional PR link"
        int location_id FK
        int supplier_id FK
        enum status "pending_approval|approved|rejected|open|closed|void"
        timestamp transaction_date
        timestamp expected_delivery_date
        numeric total_amount
        numeric discount_amount
        numeric tax_amount
        text notes
    }

    PURCHASE_ORDER_ITEMS {
        int id PK
        int order_id FK
        int request_item_id FK "nullable"
        int material_id FK "nullable"
        text item_name
        numeric quantity
        numeric unit_price
        numeric discount_amount
        numeric tax_amount
        numeric subtotal
    }

    GOODS_RECEIPT_NOTES {
        int id PK
        int order_id FK
        int location_id FK
        int supplier_id FK
        timestamp receive_date
        enum status "open|completed|void"
        text reference_number
        text notes
    }

    GOODS_RECEIPT_NOTE_ITEMS {
        int id PK
        int grn_id FK
        int purchase_order_item_id FK
        int material_id FK "nullable"
        text item_name
        numeric quantity_received
        text notes
    }

    PURCHASE_INVOICES {
        int id PK
        int order_id FK
        int supplier_id FK
        int location_id FK
        enum status "draft|open|paid|void (shared invoiceStatusEnum)"
        timestamp invoice_date
        timestamp due_date
        text external_invoice_number
        numeric total_amount
        numeric tax_amount
        numeric discount_amount
        text notes
    }

    PURCHASE_INVOICE_ITEMS {
        int id PK
        int invoice_id FK
        int purchase_order_item_id FK "nullable"
        int material_id FK "nullable"
        text item_name
        numeric quantity
        numeric unit_price
        numeric tax_amount
        numeric discount_amount
        numeric subtotal
    }

    MATERIALS {
        int id PK
    }

    LOCATIONS {
        int id PK
    }

    SUPPLIERS {
        int id PK
    }

    LOCATIONS ||--o{ PURCHASE_REQUESTS : "restrict"
    PURCHASE_REQUESTS ||--o{ PURCHASE_REQUEST_ITEMS : "cascade"
    MATERIALS ||--o{ PURCHASE_REQUEST_ITEMS : "optional"
    PURCHASE_REQUESTS ||--o{ PURCHASE_ORDERS : "optional PR->PO link"
    LOCATIONS ||--o{ PURCHASE_ORDERS : "restrict"
    SUPPLIERS ||--o{ PURCHASE_ORDERS : "restrict"
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : "cascade"
    PURCHASE_REQUEST_ITEMS ||--o{ PURCHASE_ORDER_ITEMS : "optional"
    MATERIALS ||--o{ PURCHASE_ORDER_ITEMS : "optional"
    PURCHASE_ORDERS ||--o{ GOODS_RECEIPT_NOTES : "restrict"
    LOCATIONS ||--o{ GOODS_RECEIPT_NOTES : "restrict"
    SUPPLIERS ||--o{ GOODS_RECEIPT_NOTES : "restrict"
    GOODS_RECEIPT_NOTES ||--o{ GOODS_RECEIPT_NOTE_ITEMS : "cascade"
    PURCHASE_ORDER_ITEMS ||--o{ GOODS_RECEIPT_NOTE_ITEMS : "restrict"
    MATERIALS ||--o{ GOODS_RECEIPT_NOTE_ITEMS : "optional"
    PURCHASE_ORDERS ||--o{ PURCHASE_INVOICES : "restrict"
    SUPPLIERS ||--o{ PURCHASE_INVOICES : "restrict"
    LOCATIONS ||--o{ PURCHASE_INVOICES : "restrict"
    PURCHASE_INVOICES ||--o{ PURCHASE_INVOICE_ITEMS : "cascade"
    PURCHASE_ORDER_ITEMS ||--o{ PURCHASE_INVOICE_ITEMS : "optional"
    MATERIALS ||--o{ PURCHASE_INVOICE_ITEMS : "optional"
```

Notes:

- **⚠ Two of four lifecycle stages are schema-only**: `purchase_requests`/
  `purchase_request_items` (PR stage) and `purchase_invoices`/
  `purchase_invoice_items` (AP invoicing stage) have no repo/service
  implementing them — only Order and Goods Receipt are wired up
  (`purchase-order.repo.ts`, `goods-receipt.repo.ts`). The FKs exist because
  dropping them later would be a breaking schema change for no benefit; just
  don't build against those two tables until the modules layer catches up.
- `invoiceStatusEnum` is shared with `sales.ts`'s `sales_invoices` (defined
  once in `_enums.ts`) — same document lifecycle, opposite sides of the
  ledger (payable vs receivable).

## `production.ts` + `recipe.ts` — work orders & bill of materials

```mermaid
erDiagram
    RECIPES {
        int id PK
        int material_id FK "nullable, XOR target"
        int product_id FK "nullable, XOR target"
        int product_variant_id FK "nullable, XOR target"
        text name
        numeric target_qty "> 0"
        int target_uom_id FK
        text instructions
        bool is_active
    }

    RECIPE_ITEMS {
        int id PK
        int recipe_id FK
        int material_id FK
        numeric qty "> 0"
        int uom_id FK
        numeric scrap_percentage "[0, 100)"
        int sort_order
        text notes
    }

    WORK_ORDERS {
        int id PK
        int recipe_id FK
        int location_id FK
        enum status "draft|in_progress|completed|cancelled"
        numeric expected_qty
        numeric actual_qty
        text note
        numeric total_cost
        timestamp started_at
        timestamp completed_at
    }

    MATERIALS {
        int id PK
    }

    PRODUCTS {
        int id PK
    }

    PRODUCT_VARIANTS {
        int id PK
    }

    UOMS {
        int id PK
    }

    LOCATIONS {
        int id PK
    }

    MATERIALS ||--o{ RECIPES : "target: material (cascade, XOR)"
    PRODUCTS ||--o{ RECIPES : "target: product (cascade, XOR)"
    PRODUCT_VARIANTS ||--o{ RECIPES : "target: variant (cascade, XOR)"
    UOMS ||--o{ RECIPES : "target_uom_id (restrict)"
    RECIPES ||--o{ RECIPE_ITEMS : "cascade"
    MATERIALS ||--o{ RECIPE_ITEMS : "ingredient (restrict)"
    UOMS ||--o{ RECIPE_ITEMS : "restrict"
    RECIPES ||--o{ WORK_ORDERS : "restrict"
    LOCATIONS ||--o{ WORK_ORDERS : "restrict"
```

Notes:

- `recipes` target is **XOR**-enforced: exactly one of `materialId`/
  `productId`/`productVariantId` is set. DB-enforced via a `check()` built
  from `and`/`or`/`isNull`/`isNotNull` combinations (no `CASE WHEN`
  arithmetic — see [conventions](./SCHEMA_CONVENTIONS.md#constraints--query-builder-only-never-raw-sql)),
  plus three partial unique indexes (one recipe per target).
- Variant-level recipes take priority over product-level ones when both
  exist for the same product (service-layer lookup order, not DB-enforced):
  variant recipe → product recipe → none.
- `recipeItems.uomId` may differ from the ingredient material's own
  `baseUomId` (e.g. recipe calls for grams, material's base unit is kg) —
  resolved via `material_conversions` at cost-calculation time.

## `sales.ts` — orders → voids/refunds → invoices

```mermaid
erDiagram
    SALES_ORDERS {
        int id PK
        int location_id FK
        int customer_id FK "nullable"
        int sales_type_id FK
        enum source "web|moka|upload|machine_fetch"
        enum status "open|closed|void"
        timestamp transaction_date
        numeric total_amount
        numeric discount_amount
        numeric tax_amount
        numeric gratuity_amount
        numeric refund_amount
        jsonb metadata
    }

    SALES_ORDER_BATCHES {
        int id PK
        int order_id FK
        numeric batch_number
        enum status "pending|prepared|delivered|cancelled"
    }

    SALES_ORDER_ITEMS {
        int id PK
        int order_id FK
        int batch_id FK "nullable"
        int product_id FK "nullable"
        int variant_id FK "nullable"
        text item_name
        numeric quantity
        numeric unit_price
        numeric discount_amount
        numeric tax_amount
        numeric subtotal
    }

    SALES_VOIDS {
        int id PK
        int order_id FK
        int item_id FK "nullable — null means whole order"
        text reason
        int voided_by FK "nullable"
        jsonb metadata
    }

    SALES_REFUNDS {
        int id PK
        int order_id FK
        int item_id FK "nullable — null means order-level"
        numeric amount
        text reason
        int refunded_by FK "nullable"
        timestamp refunded_at
        jsonb metadata
    }

    SALES_EXTERNAL_REFS {
        int id PK
        int order_id FK
        text external_source "Grab|Shopee|Moka|..."
        text external_order_id
        jsonb raw_payload
    }

    SALES_INVOICES {
        int id PK
        int order_id FK
        int customer_id FK "nullable"
        int location_id FK
        enum status "draft|open|paid|void (shared invoiceStatusEnum)"
        timestamp invoice_date
        timestamp due_date
        numeric total_amount
        numeric tax_amount
        numeric discount_amount
        text notes
    }

    SALES_INVOICE_ITEMS {
        int id PK
        int invoice_id FK
        int sales_order_item_id FK "nullable"
        int product_id FK "nullable"
        int variant_id FK "nullable"
        text item_name
        numeric quantity
        numeric unit_price
        numeric tax_amount
        numeric discount_amount
        numeric subtotal
    }

    LOCATIONS {
        int id PK
    }

    CUSTOMERS {
        int id PK
    }

    SALES_TYPES {
        int id PK
    }

    USERS {
        int id PK
    }

    PRODUCTS {
        int id PK
    }

    PRODUCT_VARIANTS {
        int id PK
    }

    LOCATIONS ||--o{ SALES_ORDERS : "restrict"
    CUSTOMERS ||--o{ SALES_ORDERS : "optional"
    SALES_TYPES ||--o{ SALES_ORDERS : "restrict"
    SALES_ORDERS ||--o{ SALES_ORDER_BATCHES : "cascade"
    SALES_ORDERS ||--o{ SALES_ORDER_ITEMS : "cascade"
    SALES_ORDER_BATCHES ||--o{ SALES_ORDER_ITEMS : "optional"
    PRODUCTS ||--o{ SALES_ORDER_ITEMS : "optional"
    PRODUCT_VARIANTS ||--o{ SALES_ORDER_ITEMS : "optional"
    SALES_ORDERS ||--o{ SALES_VOIDS : "cascade"
    SALES_ORDER_ITEMS ||--o{ SALES_VOIDS : "optional"
    USERS ||--o{ SALES_VOIDS : "optional"
    SALES_ORDERS ||--o{ SALES_REFUNDS : "cascade"
    SALES_ORDER_ITEMS ||--o{ SALES_REFUNDS : "optional"
    USERS ||--o{ SALES_REFUNDS : "optional"
    SALES_ORDERS ||--o{ SALES_EXTERNAL_REFS : "cascade"
    SALES_ORDERS ||--o{ SALES_INVOICES : "restrict"
    CUSTOMERS ||--o{ SALES_INVOICES : "optional"
    LOCATIONS ||--o{ SALES_INVOICES : "restrict"
    SALES_INVOICES ||--o{ SALES_INVOICE_ITEMS : "cascade"
    SALES_ORDER_ITEMS ||--o{ SALES_INVOICE_ITEMS : "optional"
    PRODUCTS ||--o{ SALES_INVOICE_ITEMS : "optional"
    PRODUCT_VARIANTS ||--o{ SALES_INVOICE_ITEMS : "optional"
```

Notes:

- Owned by two submodules: `modules/sales/sales-order` (everything except
  invoices) and `modules/sales/sales-invoice` (`sales_invoices`,
  `sales_invoice_items`).
- `sales_order_items`/`sales_invoice_items` store `productId`/`variantId` as
  **nullable** — custom/ad-hoc line items (not tied to the product catalog)
  are supported, alongside `itemName` always being stored immutably even
  when a product link exists (so renaming a product later doesn't rewrite
  history).
- `sales_orders.salesTypeId` gained a dedicated index in the last schema
  review — it's a common reporting dimension (e.g. Dine-in vs Delivery
  revenue split) that had no index at all before.
