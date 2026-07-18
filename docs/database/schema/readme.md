# Schema Reference

Column-level reference for all 48 tables, split by domain.

---

## Shared Column Groups

Spread into tables via `_helpers.ts`. Not repeated in each file below.

### `pk`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |

### `audit_basic` (AB)
| Column | Type | Constraints |
|--------|------|-------------|
| created_at | timestamptz | NOT NULL DEFAULT now() |
| updated_at | timestamptz | NOT NULL DEFAULT now() |
| created_by | integer | NOT NULL |
| updated_by | integer | NOT NULL |

### `audit_full` (AF = AB + soft-delete)
| Column | Type | Constraints |
|--------|------|-------------|
| *(all AB columns)* | | |
| deleted_at | timestamptz | nullable |
| deleted_by | integer | nullable |

---

## Files

| File | Domain | Tables |
|------|--------|--------|
| [core.md](./core.md) | IAM, Auth, Audit | roles, users, user_assignments, sessions, audit_logs |
| [master-data.md](./master-data.md) | Locations, UOM, Tax, Supplier, Company, Sales Types, Document Sequences | 7 tables |
| [materials.md](./materials.md) | Materials | categories, materials, conversions, locations, snapshots |
| [products.md](./products.md) | Products | categories, products, prices, variants, variant_prices |
| [crm.md](./crm.md) | CRM | customers, loyalty_transactions |
| [sales.md](./sales.md) | Sales | orders, batches, items, voids, refunds, ext_refs, invoices |
| [purchasing.md](./purchasing.md) | Purchasing | requests, POs, GRN, invoices (8 tables) |
| [inventory.md](./inventory.md) | Inventory | batches, adjustments, transactions, summaries, transfers |
| [finance.md](./finance.md) | Finance & Payments | accounts, journals, expenditures, payments |
| [hr.md](./hr.md) | HR | employees, shifts, attendance, payroll, leave |
| [integrations.md](./integrations.md) | Moka | configurations, scrap_histories, sync_cursors |

## Enum Reference

| Enum | Values | Domain |
|------|--------|--------|
| location_type | store, warehouse | Core |
| audit_action | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, OTHER | Core |
| customer_tier | bronze, silver, gold, platinum | CRM |
| material_type | raw, semi, packaging | Materials |
| product_status | active, inactive, archived | Products |
| invoice_status | draft, open, paid, void | Shared |
| sales_order_status | open, closed, void | Sales |
| sales_order_source | web, moka, upload, machine_fetch | Sales |
| sales_payment_status | unpaid, partial, paid | Sales |
| purchase_order_status | pending_approval, approved, rejected, open, closed, void | Purchasing |
| transaction_type | purchase, transfer_in/out, adjustment, sell, usage, production_in/out | Inventory |
| work_order_status | draft, in_progress, completed, cancelled | Production |
| account_type | ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE | Finance |
| payment_method | cash, bank_transfer, credit_card, debit_card, e_wallet | Payment |
| payment_type | payable, receivable | Payment |
| payroll_status | draft, approved, paid, cancelled | HR |
| leave_type | annual, sick, unpaid, other | HR |
