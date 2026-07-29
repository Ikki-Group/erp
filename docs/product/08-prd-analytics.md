# PRD: Analytics

Specifications for Dashboard, Reporting, and Audit Log.

## Dashboard

### Purpose

At-a-glance KPIs for owners and managers — answer "how is the business doing?" in 5 seconds.

### Widgets

| Widget | Data source | Scope |
| ------ | ----------- | ----- |
| Today's revenue | Sales | Per-location or all |
| MTD revenue | Sales | Per-location or all |
| Gross margin % | Sales + COGS | Per-location or all |
| Top 5 products (by revenue) | Sales lines | Per-location |
| Low stock alerts | Inventory | Per-location |
| Pending POs | Purchasing | All |
| Employee attendance today | HR | Per-location |
| Cash position | Finance (bank/cash accounts) | All |

### Key features

- Date range selector (today, this week, this month, custom).
- Location filter (single or consolidated).
- Auto-refresh every 60 seconds.
- Comparison: vs previous period (day/week/month/year).

## Reporting

### Standard reports

| Report | Category | Description |
| ------ | -------- | ----------- |
| Sales Summary | Sales | Revenue by product/category/sales-type/location |
| Sales Detail | Sales | Line-level transaction list |
| COGS Report | Production | Actual vs theoretical cost per product |
| Stock Movement | Inventory | All transactions for a material/product |
| Stock Valuation | Inventory | Current stock × cost per location |
| Purchase Summary | Purchasing | Spending by supplier/material/period |
| Income Statement | Finance | Revenue - Expenses (P&L) |
| Balance Sheet | Finance | Assets = Liabilities + Equity |
| Trial Balance | Finance | All account balances |
| General Ledger | Finance | Transactions per account |
| Payroll Summary | HR | Employee compensation per period |
| Attendance Report | HR | Present/absent/late per employee |

### Report features

- All reports filterable by date range and location.
- Export: CSV (all reports), PDF (financial reports).
- Scheduled reports via email (future).
- Custom date ranges with comparison periods.

## Audit Log

### Purpose

Immutable record of all data mutations for compliance and debugging.

### What is logged

| Event | Data captured |
| ----- | ------------- |
| Create | Entity type, entity ID, full payload, actor, timestamp |
| Update | Entity type, entity ID, changed fields (before/after), actor, timestamp |
| Delete | Entity type, entity ID, actor, timestamp |
| Login/Logout | User ID, IP, timestamp, success/failure |

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| action | enum | `create`, `update`, `delete`, `login`, `logout` |
| entityType | string | e.g. `product`, `sales_order`, `journal_entry` |
| entityId | integer? | ID of affected record |
| actorId | FK | Who performed the action |
| payload | jsonb | Full change data |
| ipAddress | string? | Client IP |
| timestamp | timestamp | When it happened |

### Business rules

- Audit logs are append-only. No updates, no deletes.
- Retained for minimum 5 years (configurable).
- Searchable by entity, actor, date range.
- High-volume tables (sales sync) may log at summary level (not line-by-line).

### Access control

- Only `owner` and `finance` roles can view audit logs.
- Audit log viewing itself is NOT logged (prevents infinite recursion).

---

**Next:** [09-workflows.md](./09-workflows.md) — Business workflows.
