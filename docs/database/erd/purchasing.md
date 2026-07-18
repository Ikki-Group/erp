# ERD: Purchasing

```
[purchase_requests]              [purchase_request_items]
+---------------------+          +---------------------+
| PK id               |--||--o{--| PK id               |
| * FK location_id    |          | * FK request_id     |
| * requested_by      |          |   FK material_id    |
| * status            |          | * item_name         |
| * request_date      |          | * quantity > 0      |
+---------------------+          +---------------------+
        |  (schema-only, no module yet)
        v
[purchase_orders]                [purchase_order_items]
+---------------------+          +---------------------+
| PK id               |--||--o{--| PK id               |
|   FK request_id     |          | * FK order_id       |
| * FK location_id    |          |   FK material_id    |
| * FK supplier_id    |          | * item_name         |
| * status            |          | * quantity > 0      |
| * transaction_date  |          | * price/disc/tax >= 0|
| * total/disc/tax>=0 |          +---------------------+
+---------------------+
        |
        v
[goods_receipt_notes]            [goods_receipt_note_items]
+---------------------+          +---------------------+
| PK id               |--||--o{--| PK id               |
| * FK order_id       |          | * FK grn_id         |
| * FK location_id    |          | * FK po_item_id     |
| * FK supplier_id    |          |   FK material_id    |
| * receive_date      |          | * item_name         |
| * status            |          | * qty_received > 0  |
+---------------------+          +---------------------+
        |
        v
[purchase_invoices]              [purchase_invoice_items]
+---------------------+          +---------------------+
| PK id               |--||--o{--| PK id               |
| * FK order_id       |          | * FK invoice_id     |
| * FK supplier_id    |          |   FK po_item_id     |
| * FK location_id    |          | * item_name         |
| * status            |          | * qty/price/tax     |
| * total/tax/disc>=0 |          +---------------------+
+---------------------+           (schema-only)
  (schema-only)
```

## Flow

```
Purchase Request → Purchase Order → Goods Receipt Note → Purchase Invoice
  (optional)         (required)       (receiving)          (AP billing)
```

All financial amounts are non-negative. All quantities are positive.
