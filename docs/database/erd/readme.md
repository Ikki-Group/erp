# ERD Diagrams

ASCII entity-relationship diagrams organized by domain.

---

## Notation

```
[table_name]       = table
PK                 = primary key
FK --> table       = foreign key
*                  = not null
?                  = nullable
||--o{             = one-to-many
```

## Files

| File | Domain | Tables |
|------|--------|--------|
| [core.md](./core.md) | IAM, Auth, Audit | roles, users, user_assignments, sessions, audit_logs |
| [materials.md](./materials.md) | Materials | material_categories, materials, conversions, locations, snapshots |
| [products.md](./products.md) | Products & Pricing | products, variants, prices, categories, sales_types |
| [sales.md](./sales.md) | Sales | orders, items, batches, voids, refunds, invoices, external_refs |
| [purchasing.md](./purchasing.md) | Purchasing | requests, POs, GRN, invoices |
| [inventory.md](./inventory.md) | Inventory | transactions, adjustments, transfers, summaries, batches |
| [finance.md](./finance.md) | Finance & Payments | accounts, journals, expenditures, payments |
| [hr.md](./hr.md) | HR | employees, attendance, payroll, leave |
| [crm.md](./crm.md) | CRM | customers, loyalty transactions |
| [integrations.md](./integrations.md) | Moka POS | configurations, scrap histories, sync cursors |

## Cross-Domain FK Map

```
sales_orders.customer_id        --> customers
sales_orders.location_id        --> locations
sales_orders.sales_type_id      --> sales_types
sales_order_items.product_id    --> products
purchase_orders.supplier_id     --> suppliers
purchase_orders.location_id     --> locations
stock_transactions.material_id  --> materials
stock_transactions.location_id  --> locations
work_orders.recipe_id           --> recipes
work_orders.location_id         --> locations
payments.account_id             --> accounts
payment_invoices.sales_invoice  --> sales_invoices
payment_invoices.purchase_inv   --> purchase_invoices
employees.user_id               --> users
expenditures.supplier_id        --> suppliers
```
