# ERD: Sales

```
[sales_orders]
+---------------------------+
| PK id                     |
| * FK location_id          |
|   FK customer_id          |
| * FK sales_type_id        |
| * source (web/moka/upload/machine_fetch) |
| * status (open/closed/void) |
| * transaction_date        |
| * total/discount/tax/gratuity/refund >= 0 |
| * payment_status (unpaid/partial/paid) |
| * paid_amount >= 0              |
|   metadata (jsonb)        |
+---------------------------+
    |       |       |       |            |
    |  [batches] [voids] [refunds] [external_refs]
    |  +--------+ +------+ +--------+ +-------------+
    |  |*FK ord | |*FK ord| |*FK ord | |*FK order_id |
    |  |*batch_no| |FK item| |*amount>0| |*ext_source  |
    |  |*status | |reason | |reason  | |*ext_id      |
    |  +--------+ |FK user| |FK user | |raw_payload  |
    |             +------+ +--------+ +-------------+
    |                                   (unique: src+ext_id)
[sales_order_items]
+---------------------------+
| PK id                     |
| * FK order_id (cascade)   |
|   FK batch_id             |
|   FK product_id, variant_id (set null) |
| * item_name (immutable)   |
| * product_sku, variant_name (snapshots) |
| * quantity > 0            |
| * unit_price/disc/tax/subtotal >= 0 |
+---------------------------+

[sales_invoices]                [sales_invoice_items]
+---------------------------+   +---------------------------+
| PK id                     |   | PK id                     |
| * FK order_id (restrict)  |---| * FK invoice_id (cascade) |
|   FK customer_id          |   |   FK sales_order_item_id  |
| * FK location_id          |   |   FK product/variant_id   |
| * status (draft/open/paid/void) | | * item_name           |
| * invoice_date            |   | * qty > 0, price/tax >= 0 |
|   due_date                |   +---------------------------+
| * total/tax/disc >= 0     |
+---------------------------+
```

## Key Rules

- `item_name` is stored immutably — product renames don't affect history.
- Voids: `item_id=null` means entire order voided.
- Refunds: `item_id=null` means order-level refund.
- External refs link to third-party orders (Grab, Shopee, Moka).
