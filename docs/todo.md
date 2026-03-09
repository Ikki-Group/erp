# Ikki ERP — Master Todo List

> **Last Updated:** 2026-03-08
> **Legend:** ✅ Done · 🔧 In Progress · ⬜ Todo · 🔴 Critical

---

## Current State Summary

| Module           | Server | Web UI | Status      |
| ---------------- | :----: | :----: | ----------- |
| IAM (Auth/Users) |   ✅   |   ✅   | Operational |
| Locations        |   ✅   |   ✅   | Operational |
| Materials        |   ✅   |   ✅   | Operational |
| Inventory        |   ✅   |   🔧   | Partial UI  |
| Products         |   ✅   |   ✅   | Operational |
| Recipes          |   ✅   |   🔧   | Partial UI  |
| Dashboard        |   ✅   |   🔧   | Partial     |
| Tools (Seed)     |   ✅   |   —    | Dev Only    |

---

## Phase 1: Stabilize & Complete Existing Modules

### 1.1 Inventory Module (Complete UI)

- ⬜ **Stock Transaction List Page** — DataTable with filter by material, location, date range, transaction type
- ⬜ **Stock Transaction Detail Page** — Read-only detail view
- ⬜ **Manual Stock Adjustment Form** — Form to create IN/OUT/ADJUSTMENT transactions
- ⬜ **Stock Transfer Form** — Form for location-to-location transfer
- ⬜ **Stock Summary Page** — Dashboard-style grid/table showing current stock levels per location
- ⬜ **Material Ledger Page** — Daily movement view with WAC (Weighted Average Cost)
- ⬜ **Low Stock Alerts** — Visual indicator/badge for materials below minimum threshold

### 1.2 Recipe Module (Complete UI)

- ⬜ **Recipe List Page** — DataTable with filter by product, material
- ⬜ **Recipe Create/Edit Form** — Multi-step or single form with recipe items management
- ⬜ **Recipe Detail Page** — Read-only detail with cost breakdown per item
- ⬜ **Recipe Duplication** — Quick duplicate action for cloning recipes
- ⬜ **Recipe Cost Calculator** — Auto-calculate total recipe cost based on current material prices

### 1.3 Dashboard (Enhance)

- ⬜ **Dashboard KPI Cards** — Revenue, COGS, stock value, low stock count, top products
- ⬜ **Charts** — Revenue trend, stock movement, material usage (use Recharts or Chart.js)
- ⬜ **Date Range Filter** — Global date range picker for dashboard
- ⬜ **Location Switcher** — Dashboard per-location or consolidated view
- ⬜ **Recent Activity Feed** — Timeline of recent stock transactions, orders, etc.

### 1.4 Product Module (Polish)

- ⬜ **Product Detail Page** — Full read-only view with variants, prices, external mappings
- ⬜ **Product Import/Export** — CSV/Excel import & export for bulk product management
- ⬜ **Product Image Upload** — Image storage & display (S3/R2 integration)
- ⬜ **Product Status Workflow** — Visual status badges + status transition actions (draft → active → archived)

---

## Phase 2: Purchasing Module (New)

> Layer 2 — Depends on: Materials, Location, IAM

### 2.1 Server

- ⬜ **DB Schema** — `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`
- ⬜ **Supplier CRUD** — Service, DTO, Router for supplier master data
- ⬜ **Purchase Order CRUD** — Create PO with items, approve/reject workflow
- ⬜ **Goods Receipt** — Receiving against PO, auto-create stock transactions (IN)
- ⬜ **PO Status Workflow** — `draft → submitted → approved → partially_received → received → cancelled`
- ⬜ **Supplier Price List** — Track material prices per supplier

### 2.2 Web

- ⬜ **Supplier List & Form Pages**
- ⬜ **Purchase Order List Page** — Status filter tabs, search
- ⬜ **Purchase Order Create/Edit Form** — Item picker, quantity, price
- ⬜ **Purchase Order Detail Page** — Status badge, approval actions, receipt history
- ⬜ **Goods Receipt Form** — Receive items against PO
- ⬜ **Supplier Price Comparison** — Table comparing prices across suppliers

---

## Phase 3: Sales & Order Management Module (New)

> Layer 2 — Depends on: Products, Inventory, Location, IAM

### 3.1 Server

- ⬜ **DB Schema** — `customers`, `sales_orders`, `sales_order_items`, `invoices`, `invoice_items`
- ⬜ **Customer CRUD** — Service, DTO, Router for customer master data
- ⬜ **Sales Order CRUD** — Create SO with items, status workflow
- ⬜ **Invoice Generation** — Generate invoice from SO, track payment status
- ⬜ **SO Status Workflow** — `draft → confirmed → processing → shipped → delivered → cancelled`
- ⬜ **Stock Reservation** — Reserve inventory upon SO confirmation
- ⬜ **Stock Deduction** — Auto-create stock transactions (OUT) on delivery

### 3.2 Web

- ⬜ **Customer List & Form Pages**
- ⬜ **Sales Order List Page** — Status filter tabs, date range filter
- ⬜ **Sales Order Create/Edit Form** — Product/variant picker, price auto-fill
- ⬜ **Sales Order Detail Page** — Status timeline, invoice link, stock allocation
- ⬜ **Invoice List & Detail Pages** — Payment status tracking
- ⬜ **POS-style Quick Order** — Simplified order entry screen (optional, F&B friendly)

---

## Phase 4: Production / Manufacturing Module (New)

> Layer 2 — Depends on: Recipes, Inventory, Materials, Location

### 4.1 Server

- ⬜ **DB Schema** — `production_orders`, `production_order_items`, `production_logs`
- ⬜ **Production Order CRUD** — Based on recipe, define batch size
- ⬜ **Material Consumption** — Auto-deduct raw materials based on recipe × batch (stock OUT)
- ⬜ **Finished Goods Receipt** — Auto-add finished product to inventory (stock IN)
- ⬜ **Production Status Workflow** — `planned → in_progress → completed → cancelled`
- ⬜ **Yield & Waste Tracking** — Record actual vs expected output

### 4.2 Web

- ⬜ **Production Order List Page** — Status filter, date range
- ⬜ **Production Order Create Form** — Select product/recipe, set batch size, auto-calculate BOM
- ⬜ **Production Order Detail Page** — Material consumption, yield, status timeline
- ⬜ **Production Calendar / Kanban View** — Visual scheduling board

---

## Phase 5: Accounting & Finance Module (New)

> Layer 3 — Depends on: All transaction modules

### 5.1 Server

- ⬜ **DB Schema** — `accounts` (chart of accounts), `journal_entries`, `journal_entry_lines`, `fiscal_periods`
- ⬜ **Chart of Accounts (COA)** — CRUD for account hierarchy (asset, liability, equity, revenue, expense)
- ⬜ **Journal Entry Service** — Double-entry bookkeeping engine
- ⬜ **Auto Journal Entries** — Auto-post from PO receipt, SO invoice, stock adjustment
- ⬜ **Fiscal Period Management** — Open/close periods, prevent back-dating
- ⬜ **Account Balances** — Real-time balance calculation per account

### 5.2 Web

- ⬜ **Chart of Accounts Page** — Tree view of account hierarchy
- ⬜ **Journal Entry List & Form** — Manual journal entry with debit/credit lines
- ⬜ **General Ledger Report** — Filter by account, period
- ⬜ **Trial Balance Report** — Summary of all accounts
- ⬜ **Profit & Loss Statement** — Revenue minus expenses for a period
- ⬜ **Balance Sheet Report** — Assets = Liabilities + Equity

---

## Phase 6: Reporting & Analytics Module (New)

> Layer 3 — Aggregator

### 6.1 Server

- ⬜ **Report Engine** — Generic reporting service with filter, group-by, aggregate
- ⬜ **Sales Reports** — Sales by product, category, location, period
- ⬜ **Purchase Reports** — Purchase by supplier, material, period
- ⬜ **Inventory Reports** — Stock aging, slow-moving items, stock valuation
- ⬜ **Production Reports** — Production efficiency, yield %, waste analysis
- ⬜ **Financial Reports** — P&L, Balance Sheet, Cash Flow
- ⬜ **Report Export** — PDF & Excel export (via worker/background job)

### 6.2 Web

- ⬜ **Report Builder UI** — Select report type, configure filters, generate
- ⬜ **Report Viewer** — Table + chart visualization
- ⬜ **Saved Reports / Favorites** — Save frequently used report configs
- ⬜ **Report Scheduling** — Auto-generate & email reports (future)
- ⬜ **Data Export** — Download CSV/Excel/PDF from any report

---

## Phase 7: Cross-Cutting Concerns & Infrastructure

### 7.1 Authentication & Authorization Hardening

- ⬜ **Permission System** — Granular permissions per module/action (e.g., `inventory.stock.adjust`)
- ⬜ **Role-Based Access Control (RBAC)** — Assign permissions to roles, roles to users
- ⬜ **UI Permission Guard** — Hide/disable buttons/menus based on user permissions
- ⬜ **API Permission Middleware** — Server-side permission check on every route
- ⬜ **Multi-Location Access Control** — Restrict user access to specific locations
- ⬜ **Password Policy** — Minimum length, complexity, expiration (optional)
- ⬜ **Session Management UI** — View/revoke active sessions

### 7.2 Audit Trail & Activity Log

- ⬜ **DB Schema** — `audit_logs` table (entity, action, old_value, new_value, actor, timestamp)
- ⬜ **Auto Audit Logging** — Middleware to log all CUD operations automatically
- ⬜ **Audit Log Viewer** — Admin UI to search/filter audit trail
- ⬜ **Data Change History** — Per-record history (who changed what, when)

### 7.3 Notification System

- ⬜ **In-App Notifications** — Bell icon with dropdown, unread count
- ⬜ **Notification Types** — Low stock, PO approval needed, SO status change, etc.
- ⬜ **WebSocket / SSE** — Real-time notification delivery
- ⬜ **Email Notifications** — Critical alerts via email (optional)
- ⬜ **Notification Preferences** — User can toggle which notifications to receive

### 7.4 File / Document Management

- ⬜ **File Upload Service** — Integrate S3/R2 for file storage
- ⬜ **Document Attachments** — Attach files to PO, SO, products, etc.
- ⬜ **Image Handling** — Resize, compress, thumbnail generation
- ⬜ **File Manager UI** — Browse/delete uploaded files

### 7.5 Multi-Tenancy & Company Settings

- ⬜ **Company Profile** — Company name, logo, address, tax ID
- ⬜ **System Settings** — Currency, date format, timezone, default location
- ⬜ **Tax Configuration** — Tax rates, tax groups, automatic tax calculation
- ⬜ **Numbering Sequences** — Auto-increment codes (PO-2026-0001, SO-2026-0001, INV-2026-0001)

### 7.6 Background Jobs & Queuing

- ⬜ **Job Queue** — BullMQ or custom Bun-based job queue
- ⬜ **Scheduled Jobs** — Stock summary regeneration, report generation, cleanup
- ⬜ **Job Dashboard** — Admin UI to monitor job status, retry failed jobs

---

## Phase 8: Web UI Polish & UX

### 8.1 Global UI/UX

- ⬜ **Global Search / Command Palette** — `Cmd+K` search across all entities (materials, products, orders)
- ⬜ **Breadcrumb Navigation** — Context-aware breadcrumbs on all pages
- ⬜ **Toast / Notification System** — Success/error/info toasts for all actions
- ⬜ **Loading States** — Skeleton loaders for all DataTables and forms
- ⬜ **Empty States** — Friendly empty state illustrations for new accounts
- ⬜ **Error Boundary** — Graceful error handling with retry actions
- ⬜ **Dark Mode** — Full dark mode support (Tailwind CSS v4 dark variant)
- ⬜ **Responsive Design** — Mobile-friendly sidebar, tables, forms
- ⬜ **Keyboard Shortcuts** — Navigation shortcuts for power users

### 8.2 Navigation & Layout

- ⬜ **Sidebar Navigation** — Collapsible sidebar with module grouping
- ⬜ **Quick Actions Menu** — Floating action button for common actions
- ⬜ **Tab-based MultiPage** — Open multiple records in tabs (optional)
- ⬜ **User Profile Page** — Edit profile, change password, view sessions

### 8.3 Data Table Enhancements

- ⬜ **Column Visibility Toggle** — User-selectable visible columns
- ⬜ **Column Reordering** — Drag & drop column order
- ⬜ **Saved Filters / Views** — Save frequently used filter configurations
- ⬜ **Bulk Actions** — Multi-select rows + bulk delete/update/export
- ⬜ **Inline Editing** — Quick edit cells without opening form (optional)
- ⬜ **Export to CSV/Excel** — Export current view with applied filters

---

## Phase 9: DevOps, Testing & Quality

### 9.1 Testing

- ⬜ **Server Unit Tests** — Service layer tests for all modules (target: 80% coverage)
- ⬜ **Server Integration Tests** — API endpoint tests with test database
- ⬜ **Web Component Tests** — Vitest + Testing Library for key components
- ⬜ **E2E Tests** — Playwright for critical user flows (login, create order, stock adjustment)
- ⬜ **Test Data Seeding** — Comprehensive seed script for development/testing

### 9.2 CI/CD Pipeline

- ⬜ **GitHub Actions** — Lint → Type-check → Test → Build on every PR
- ⬜ **Preview Deployments** — Deploy PR preview to staging (Fly.io / Vercel)
- ⬜ **Production Deploy** — Auto-deploy `main` branch
- ⬜ **Database Migrations CI** — Auto-run migrations on deploy

### 9.3 Monitoring & Observability

- ⬜ **Health Check Endpoint** — `/health` with DB connectivity check
- ⬜ **OpenTelemetry Tracing** — Enhance existing otel setup with more spans
- ⬜ **Structured Logging** — Ensure all modules use pino logger consistently
- ⬜ **Error Tracking** — Sentry integration (server + web)
- ⬜ **Performance Monitoring** — API response time tracking, slow query detection

### 9.4 Security

- ⬜ **Rate Limiting** — Per-IP and per-user rate limits on auth endpoints
- ⬜ **CSRF Protection** — Token-based CSRF for state-changing requests
- ⬜ **Input Sanitization** — XSS prevention on all user inputs
- ⬜ **SQL Injection Prevention** — Ensure parameterized queries everywhere (Drizzle handles this)
- ⬜ **CORS Configuration** — Production-only allowed origins
- ⬜ **Secrets Management** — Rotate JWT secrets, use env-based config
- ⬜ **Dependency Scanning** — Automated vulnerability scanning (Snyk/Dependabot)

---

## Phase 10: Advanced Features (Future)

### 10.1 Multi-Currency Support

- ⬜ **Currency Master** — CRUD for currencies (IDR, USD, SGD, etc.)
- ⬜ **Exchange Rate Management** — Daily exchange rate update
- ⬜ **Multi-Currency Transactions** — PO/SO in foreign currency with conversion

### 10.2 Warehouse Management (Advanced)

- ⬜ **Bin/Rack Location** — Sub-location management within a warehouse
- ⬜ **Batch / Lot Tracking** — Track materials by batch number
- ⬜ **Expiry Date Tracking** — FEFO (First Expiry First Out) management
- ⬜ **Barcode / QR Code** — Generate & scan barcodes for stock operations
- ⬜ **Stock Take / Cycle Count** — Physical inventory count workflow

### 10.3 CRM (Customer Relationship Management)

- ⬜ **Contact Management** — Customer contacts, communication history
- ⬜ **Lead Pipeline** — Lead → opportunity → customer conversion
- ⬜ **Customer Segmentation** — Tags, groups, loyalty tiers

### 10.4 HR & Payroll (Optional)

- ⬜ **Employee Management** — Employee records, departments, positions
- ⬜ **Attendance Tracking** — Clock in/out, leave management
- ⬜ **Payroll Calculation** — Salary, deductions, payslip generation

### 10.5 Integration & API

- ⬜ **REST API Documentation** — Auto-generated Swagger/OpenAPI docs
- ⬜ **Webhook System** — Outgoing webhooks for external integrations
- ⬜ **External POS Integration** — Sync with Moka, GoBiz, etc. (expand existing external mappings)
- ⬜ **Accounting Software Sync** — Export to Jurnal.id, Accurate, etc.

---

## Priority Matrix

| Priority | Phase         | Rationale                                  |
| -------- | ------------- | ------------------------------------------ |
| 🔴 P0    | Phase 1       | Complete existing modules before expanding |
| 🔴 P0    | Phase 7.1     | Auth/permissions are foundational          |
| 🟡 P1    | Phase 2       | Purchasing is core ERP                     |
| 🟡 P1    | Phase 3       | Sales is core ERP                          |
| 🟡 P1    | Phase 7.2     | Audit trail needed before going live       |
| 🟠 P2    | Phase 4       | Production ties recipes to inventory       |
| 🟠 P2    | Phase 5       | Finance completes the ERP loop             |
| 🟠 P2    | Phase 8       | UI polish for user adoption                |
| 🔵 P3    | Phase 6       | Reporting drives business value            |
| 🔵 P3    | Phase 7.3–7.6 | Infrastructure improvements                |
| 🔵 P3    | Phase 9       | Testing & DevOps for reliability           |
| ⚪ P4    | Phase 10      | Advanced features after core is stable     |
