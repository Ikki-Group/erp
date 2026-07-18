# ERD: Finance & Payments

```
[accounts]                           [journal_entries]
+---------------------+              +---------------------+
| PK id               |              | PK id               |
| * code (unique)     |              | * date              |
| * name              |              | * reference         |
| * type (ASSET/LIAB/ |              | * source_type + id  |
|   EQUITY/REV/EXP)   |              +---------------------+
| * is_group          |                      |
|   FK parent_id(self)|              [journal_items]
+---------------------+              +---------------------+
        |                            | * FK journal_entry  |
        |                            | * FK account_id     |
        |                            | * debit >= 0        |
        +----------------------------| * credit >= 0       |
        |                            +---------------------+
[expenditures]
+---------------------+
| * type (BILLS/ASSET/PURCHASES)  |
| * status, title, date           |
| * amount > 0                    |
| * FK source_account (cash/bank) |
| * FK target_account (exp/asset) |
|   FK liability_account          |
|   FK supplier_id                |
| * FK location_id                |
+---------------------+

[payment_providers]    [payment_methods]    [location_payment_methods]
+------------------+   +------------------+  +------------------------+
| * code (unique)  |   | * type (enum)    |  | * FK location_id       |
| * name           |   | * category       |  | * FK payment_method_id |
| * is_active      |   | * name           |  |   credentials (jsonb)  |
| * is_system      |   | * is_global      |  |   config (jsonb)       |
+------------------+   |   FK provider_id |  +------------------------+
                       +------------------+

[payments]                       [payment_invoices]
+---------------------+          +---------------------+
| * type (payable/    |--||--o{--| * FK payment_id     |
|   receivable)       |          |   FK sales_invoice  |
| * FK account_id     |          |   FK purchase_inv   |
| * method (enum)     |          | * amount > 0        |
| * amount > 0        |          +---------------------+
+---------------------+
```

## Key Rules

- Accounts form a tree (parent_id self-reference). `is_group=true` = branch node.
- Journal entries are always balanced (sum debit = sum credit, enforced by service).
- Payments bridge Sales ↔ Finance ↔ Purchasing via `payment_invoices`.
- `location_payment_methods.credentials` stores provider-specific secrets (jsonb).
