# ERP Development Timeline & Tracker

> **Version**: 1.1  
> **Last Updated**: 2026-03-26  
> **Changelog**:
>
> - `v1.1` (2026-03-26) — Synced task statuses with actual codebase, added Moka integration phase, reordered phases to match reality
> - `v1.0` (Initial) — Original timeline with placeholder statuses

This document serves as the roadmap and sprint tracker for the Ikki ERP development lifecycle. The project is divided into distinct, manageable phases designed to prevent scope creep and ensure systematic delivery.

---

## Phase 1: Infrastructure & Core Setup ✅

**Objective**: Establish a robust Monorepo architecture, configure high-performance development tooling (Linters/Formatters), and initialize the foundational Layer 0 database schemas.

| Status | Task ID  | Description                                                                            | Component | Dependency |
| :----: | :------- | :------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `INF-01` | Initialize Bun Workspaces for `apps/web`, `apps/server`, and `packages/*`.             | Monorepo  | -          |
|   ✅   | `INF-02` | Implement Oxlint & Oxfmt for optimized workspace validation.                           |  Config   | `INF-01`   |
|   ⏳   | `INF-03` | Establish standard OpenAPI specifications & Shared Zod Schemas within `packages/api`.  |  Backend  | `INF-01`   |
|   ✅   | `DB-01`  | Design and generate Drizzle schemas for Master Data (`locations`, `materials`, `uom`). |  Backend  | -          |
|   ✅   | `WEB-01` | Scaffold frontend utilizing Vite, React 19, Tailwind v4, Base UI, and TanStack Router. | Frontend  | -          |

> **Note**: `INF-03` (shared packages/api workspace) is deferred. Zod schemas currently reside within each server module's `dto/` directory.

---

## Phase 2: IAM & Master Data ✅

**Objective**: Implement system security via Role-Based Access Control (RBAC) and develop the core application interfaces for location and material management.

| Status | Task ID  | Description                                                                         | Component | Dependency |
| :----: | :------- | :---------------------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `IAM-01` | Develop Auth Router (JWT) and RBAC Drizzle schemas.                                 |  Backend  | `INF-03`   |
|   ✅   | `IAM-02` | Implement Login Page and protected routes managing state via Zustand.               | Frontend  | `WEB-01`   |
|   ✅   | `MST-01` | Develop CRUD APIs for `locations` and `materials` (ensuring multi-UOM scale logic). |  Backend  | `DB-01`    |
|   ✅   | `MST-02` | Build UI DataTables and TanStack Forms for Master Data management.                  | Frontend  | `MST-01`   |

---

## Phase 3: Products & Recipes ✅

**Objective**: Establish product catalog management and recipe/BOM definitions.

| Status | Task ID  | Description                                                              | Component | Dependency |
| :----: | :------- | :----------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `PRD-01` | Develop Product CRUD APIs (categories, sales types, external mappings).  |  Backend  | `DB-01`    |
|   ✅   | `PRD-02` | Build Product management UI with DataTables and Forms.                   | Frontend  | `PRD-01`   |
|   ✅   | `RCP-01` | Develop Recipe CRUD APIs with BOM item management.                       |  Backend  | `MST-01`   |
|   🏃   | `RCP-02` | Build Recipe management UI (list, create/edit, detail, cost calculator). | Frontend  | `RCP-01`   |

---

## Phase 4: Inventory Engine 🏃

**Objective**: Construct the core warehouse operations module ensuring accurate tracking of stock movements, internal transfers, and physical adjustments.

| Status | Task ID  | Description                                                                  | Component | Dependency |
| :----: | :------- | :--------------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `INV-01` | Establish database schemas for `stock_movements` and `stock_summaries`.      |  Backend  | `MST-01`   |
|   ✅   | `INV-02` | Develop transactional APIs for Inbound, Outbound, and Internal Transfers.    |  Backend  | `INV-01`   |
|   ✅   | `INV-03` | Implement Stock Summary generation with WAC calculation and material ledger. |  Backend  | `INV-02`   |
|   🏃   | `INV-04` | Construct Stock Movement Dashboards and Opname data entry forms.             | Frontend  | `INV-02`   |

---

## Phase 5: External Integrations — Moka POS ✅

**Objective**: Integrate with Moka POS for product sync, sales data scraping, and scrap/waste tracking.

| Status | Task ID   | Description                                                       | Component | Dependency |
| :----: | :-------- | :---------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `MOKA-01` | Implement Moka Auth service (OAuth token management).             |  Backend  | -          |
|   ✅   | `MOKA-02` | Develop product, category, and sales scraping engine.             |  Backend  | `MOKA-01`  |
|   ✅   | `MOKA-03` | Build Moka configuration management API (per-outlet settings).    |  Backend  | `MOKA-01`  |
|   ✅   | `MOKA-04` | Implement scrap history tracking and data transformation service. |  Backend  | `MOKA-02`  |
|   🏃   | `MOKA-05` | Build Moka management UI (configuration, sync status).            | Frontend  | `MOKA-03`  |

---

## Phase 6: Sales Module 🏃

**Objective**: Implement sales order management with inventory integration.

| Status | Task ID  | Description                                                         | Component | Dependency |
| :----: | :------- | :------------------------------------------------------------------ | :-------: | :--------- |
|   ✅   | `SAL-01` | Develop Sales Order CRUD API with status workflow.                  |  Backend  | `MST-01`   |
|   🏃   | `SAL-02` | Build Sales Order management UI (list, create/edit, detail).        | Frontend  | `SAL-01`   |
|   ⏳   | `SAL-03` | Integrate Delivery Order (DO): dispatching triggers outbound stock. | Fullstack | `INV-02`   |

---

## Phase 7: Purchasing & Procurement ⏳

**Objective**: Manage the lifecycle of procurement from requisition to goods receipt.

| Status | Task ID  | Description                                                                         | Component | Dependency |
| :----: | :------- | :---------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `PUR-01` | Develop API and UI for Purchase Requisition (PR) to Purchase Order (PO) conversion. | Fullstack | `MST-01`   |
|   ⏳   | `PUR-02` | Integrate Goods Receipt Note (GRN): Receiving triggers Inbound Stock automatically. | Fullstack | `INV-02`   |

---

## Phase 8: Manufacturing & Production ⏳

**Objective**: Automate the conversion of Raw Materials into Finished Goods via structured Bills of Materials (BOM).

| Status | Task ID  | Description                                                          | Component | Dependency |
| :----: | :------- | :------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `MFG-01` | Develop Production Order APIs based on Recipe/BOM definitions.       | Fullstack | `RCP-01`   |
|   ⏳   | `MFG-02` | Implement WIP service: Record material consumption and yield output. | Fullstack | `INV-02`   |

---

## Phase 9: Dashboard & Analytics 🏃

**Objective**: Deliver high-level management dashboards and secure optimal system performance across all modules.

| Status | Task ID   | Description                                                                             | Component | Dependency |
| :----: | :-------- | :-------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ✅   | `DASH-01` | Implement Upstash Redis caching layer for heavy data aggregations.                      |  Backend  | All        |
|   🏃   | `DASH-02` | Develop analytical charts via Recharts and review Sentry error tracking implementation. | Frontend  | All        |

---

### Status Legend

- `⏳` : To Do (Ready for development)
- `🏃` : In Progress (Currently under development)
- `✅` : Completed (Developed and passing verifications)
- `🛑` : Blocked (Awaiting external dependency or clarification)
