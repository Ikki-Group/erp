# Ikki ERP Development Timeline & Tracker

> **Version**: 2.0  
> **Last Updated**: 2026-03-28  
> **Changelog**:
>
> - `v2.0` (2026-03-28) — Completely realigned phases to match Ikki F&B specific module blueprints (Layer 0 to Layer 3). Grouped into MVP and Enterprise Extensions.
> - `v1.1` (2026-03-26) — Synced task statuses with actual codebase, added Moka integration.

This document serves as the roadmap and sprint tracker for the Ikki ERP development lifecycle.

---

## MVP (Phase 1) - Core F&B Operations

### Phase 1: Infrastructure & Core Setup ✅
**Objective**: Establish Monorepo architecture, development tooling, and Drizzle schemas.

| Status | Task ID  | Description                                                                            | Component | Dependency |
| :----: | :------- | :------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `INF-01` | Initialize Bun Workspaces for `apps/web` and `apps/server`.                            | Monorepo  | -          |
|   ✅   | `INF-02` | Implement Oxlint & Oxfmt for optimized workspace validation.                           |  Config   | `INF-01`   |
|   ✅   | `DB-01`  | Design and generate Drizzle schema representations derived from `ERD.md`.              |  Backend  | -          |
|   ✅   | `WEB-01` | Scaffold frontend utilizing Vite, React 19, Tailwind v4, Base UI, and TanStack Router. | Frontend  | -          |

### Phase 2: IAM & Security (Layer 1.5) ✅
**Objective**: Build secure gateway using JWT/Argon2id and restrict data by Location.

| Status | Task ID  | Description                                                                         | Component | Dependency |
| :----: | :------- | :---------------------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `IAM-01` | Develop Auth Router (JWT, Argon2id) and User/Role schemas.                          |  Backend  | `DB-01`    |
|   ✅   | `IAM-02` | Implement strict Location-Based Access Control (LBAC) filters in Elysia middleware. |  Backend  | `IAM-01`   |
|   ✅   | `IAM-03` | Develop Login Page and global state authentication (Zustand).                       | Frontend  | `WEB-01`   |

### Phase 3: Master Data / Layer 0 & 1 ✅
**Objective**: Create the core catalogs for Locations (Outlets), Materials (Ingredients), and Products (Menus).

| Status | Task ID  | Description                                                                         | Component | Dependency |
| :----: | :------- | :---------------------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `MD-01`  | Develop CRUD APIs for `locations` (Outlets/Warehouses).                             |  Backend  | `DB-01`    |
|   ✅   | `MD-02`  | Develop CRUD APIs for `products` and `categories` (Moka POS mapping targets).       |  Backend  | `DB-01`    |
|   ✅   | `MD-03`  | Develop CRUD APIs for `materials` and `uom_conversions` (Base -> Alt multipliers).  |  Backend  | `DB-01`    |
|   ✅   | `MD-04`  | Build UI DataTables for Master Data management.                                     | Frontend  | `MD-01`    |

### Phase 4: Recipes & BOM (Layer 2) 🏃
**Objective**: Link materials to products, supporting sub-recipes and real-time HPP (Costing).

| Status | Task ID  | Description                                                              | Component | Dependency |
| :----: | :------- | :----------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `RCP-01` | Develop Recipe CRUD APIs, linking Products with Material Lines.          |  Backend  | `MD-02`    |
|   🏃   | `RCP-02` | Implement Auto-Costing Engine (calculating recipe HPP via joined WAC).   |  Backend  | `RCP-01`   |
|   🏃   | `RCP-03` | Build Recipe UI (Menu construction, sub-recipes, HPP viewer).            | Frontend  | `RCP-01`   |

### Phase 5: Inventory Engine (Layer 2) 🏃
**Objective**: Track movement of goods specifically for F&B workflows (Transfers, Waste, Opname).

| Status | Task ID  | Description                                                                  | Component | Dependency |
| :----: | :------- | :--------------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `INV-01` | Develop APIs for Internal Transfers (Warehouse -> Outlet).                   |  Backend  | `MD-01`    |
|   ✅   | `INV-02` | Develop APIs for Manual Deductions (Waste/Spoilage).                         |  Backend  | `INV-01`   |
|   ✅   | `INV-03` | Implement Material Ledger & dynamic WAC Cost accumulation.                   |  Backend  | `INV-01`   |
|   🏃   | `INV-04` | Construct Stock Opname Forms (Expected vs Actual).                           | Frontend  | `INV-03`   |

### Phase 6: Purchasing (Layer 2) ⏳
**Objective**: Flow to acquire new raw materials and update base cost tracking.

| Status | Task ID  | Description                                                                         | Component | Dependency |
| :----: | :------- | :---------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `PUR-01` | Develop Purchase Requisition (PR) and PO Approval endpoints.                        |  Backend  | `MD-03`    |
|   ⏳   | `PUR-02` | Integrate Goods Receipt Note (GRN): Locks costs and triggers Inbound Stock.         |  Backend  | `INV-01`   |
|   ⏳   | `PUR-03` | Build UI pipelines for Procurement tracking.                                        | Frontend  | `PUR-01`   |

### Phase 7: External Integrations — Moka POS (Layer 3) 🏃
**Objective**: Automate sales imports from cashiers and instantly deduct stock via Recipes.

| Status | Task ID   | Description                                                       | Component | Dependency |
| :----: | :-------- | :---------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `MOKA-01` | Implement Moka OAuth API and token persistence.                   |  Backend  | `DB-01`    |
|   ✅   | `MOKA-02` | Develop product, category, and sales scraping engine.             |  Backend  | `MOKA-01`  |
|   🏃   | `MOKA-03` | Construct the Auto-Deduction trigger: Sales -> Recipe -> Inventory. |  Backend  | `RCP-01`   |
|   🏃   | `MOKA-04` | Build Moka management UI (mapping unmatched items).               | Frontend  | `MOKA-02`  |

### Phase 8: Dashboard & Analytics (Layer 3) ⏳
**Objective**: Live KPIs for Owners and General Managers.

| Status | Task ID   | Description                                                                             | Component | Dependency |
| :----: | :-------- | :-------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `DASH-01` | Implement Redis aggregation engine for Gross Profit Margins (Revenue minus COGS).       |  Backend  | All        |
|   ⏳   | `DASH-02` | Develop Low-Stock Warning DataGrid per Outlet.                                          |  Backend  | `INV-03`   |
|   ⏳   | `DASH-03` | Render analytical charts via Recharts (Top Revenue vs Cost Drivers).                    | Frontend  | `DASH-01`  |

---

## Phase 9: Enterprise F&B Extensions (Phase 2) ⏳

**Objective**: Expand the startup MVP into a full-scale corporate ERP by integrating Back-office modules.

| Status | Task ID    | Description                                                                             | Component | Dependency |
| :----: | :--------- | :-------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `EXT-FIN`  | Develop Finance & Accounting APIs (General Ledger, AP/AR, Petty Cash, P&L generation).  | Fullstack | All        |
|   ⏳   | `EXT-SRM`  | Develop Supplier Management (SRM) APIs to lock PO prices and track vendor lead times.   | Fullstack | `PUR-01`   |
|   ⏳   | `EXT-HRIS` | Implement HRIS & Payroll (Attendance, Shifts, Automated Salary/Service Charge split).   | Fullstack | `IAM-01`   |
|   ⏳   | `EXT-AST`  | Build Fixed Asset Tracking and Automated Monthly Depreciation Journals.                 | Fullstack | `EXT-FIN`  |
|   ⏳   | `EXT-MFG`  | Establish Central Kitchen Work Orders, batch cooking yields, and Shrinkage computations.| Fullstack | `RCP-01`   |
|   ⏳   | `EXT-B2B`  | Create B2B Sales / Wholesale pipelines (Quotations, Delivery Orders, Credit Invoices).  | Fullstack | `INV-01`   |

---

### Status Legend

- `⏳` : To Do (Ready for development)
- `🏃` : In Progress (Currently under development)
- `✅` : Completed (Developed and passing verifications)
- `🛑` : Blocked (Awaiting external dependency or clarification)
