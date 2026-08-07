# Development Timeline

Phased delivery plan for Ikki ERP.

## Phase Overview

| Phase | Name | Core Deliverable |
|-------|------|------------------|
| 1 | Foundation & Daily Ops | POS + Inventory + Recipe auto-deduct |
| 2 | People & Money | Finance (full accounting) + HR (payroll) |
| 3 | Growth | CRM/Loyalty + Moka import + Advanced reporting |

## Phase 1 — Foundation & Daily Ops

**Goal:** Replace manual processes. Working POS with stock tracking.

### Modules

| Module | Scope |
|--------|-------|
| Core | Location (store/warehouse), IAM, Auth, Company Settings |
| Master Data | Materials (global), UoM (chain), Suppliers |
| Menu | Menu Items (per-location), Categories, Modifier Groups, Recipes |
| Inventory | Stock Balance, Stock Movements, Transfer Requests, Receiving, Stock Opname |
| POS | Orders (open/close bill), Table management, Payments, Cashier Shifts, Void |

### Key Capabilities After Phase 1

- Switch between locations (stores and warehouses).
- Manage menu items with modifiers per store.
- Process orders (dine-in with table, takeaway).
- Open bill and close bill workflows.
- Split payment across multiple methods.
- Auto-deduct materials on sale (via recipe).
- Track stock across all locations.
- Transfer materials between locations.
- Receive goods from suppliers (updates stock + cost).
- Physical stock count (opname).
- Low stock alerts on dashboard.
- Audit trail on all operations.

## Phase 2 — People & Money

**Goal:** Financial visibility and staff management.

### Modules

| Module | Scope |
|--------|-------|
| Finance | Chart of Accounts, Journal Entries (auto + manual), AP, Fiscal Periods, P&L, Balance Sheet |
| HR | Employees, Shift Templates, Shift Assignments, Attendance, Payroll, Leave |
| Expenses | Operational expense recording (rent, utilities, etc.) |

### Key Capabilities After Phase 2

- Full double-entry accounting.
- Auto-journals from POS sales, purchases, payroll.
- Manual journal entries for expenses.
- Accounts Payable tracking (supplier credit).
- P&L report per location and company-wide.
- Balance Sheet.
- Employee profiles with multi-location assignment.
- Shift scheduling and attendance tracking.
- Monthly payroll with variable components.
- Leave management.

## Phase 3 — Growth

**Goal:** Customer retention, data migration, analytics.

### Modules

| Module | Scope |
|--------|-------|
| CRM | Customer profiles, Loyalty (points, tiers, redemption), Promotions |
| Integration | Moka import (sales + master data mapping) |
| Reporting | Dashboard v2, Sales analytics, Margin analysis, Stock reports |

### Key Capabilities After Phase 3

- Customer database with purchase history.
- Points-based loyalty program with tiers.
- Targeted promotions.
- Import historical data from Moka.
- Comprehensive dashboards (revenue, margin, stock, customer).
- Export capabilities (CSV).

## Post-Launch Roadmap

- Mobile app (React Native or PWA)
- Offline POS capability
- Modifier → recipe override
- Purchasing workflow (PO → approval → receive)
- Advanced reporting (custom builder)
- PDF exports (receipts, invoices, payslips)
- E-commerce order ingestion
- WhatsApp/email notifications

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| UoM chain complexity | Validate all conversion paths at material creation |
| Modifier + recipe complexity | Backlog modifier→recipe for Phase 1, base recipe only |
| Finance module scope | Auto-journals first, manual entries and reports follow |
| Moka API reliability | CSV fallback for import |

---

**Next:** [readme.md](./readme.md) — Back to product index.
