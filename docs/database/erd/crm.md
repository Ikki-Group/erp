# ERD: CRM

```
[customers]                          [customer_loyalty_transactions]
+---------------------------+        +------------------------------+
| PK id                     |        | PK id                        |
| * code (unique)           |--o{----| * FK customer_id (cascade)   |
| * name (unique)           |        | * type (earned/redeemed/     |
|   email, phone, address   |        |   adjusted/expired)          |
|   tax_id                  |        | * points (signed)            |
|   date_of_birth           |        | * balance_after >= 0         |
|   tier (bronze→platinum)  |        |   reference_type + id        |
| * points_balance >= 0     |        |   description                |
| * total_points_earned >= 0|        +------------------------------+
|   registered_at           |
|   last_visit_at           |
+---------------------------+
```

## Key Rules

- Loyalty transactions form an append-only ledger.
- `balance_after` tracks running balance (must be non-negative).
- `reference_type` + `reference_id` links back to source (e.g., sales_order).
- Tier progression is managed by service layer, not DB triggers.
