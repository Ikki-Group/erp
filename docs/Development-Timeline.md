# ERP Development Timeline & Tracker

This document serves as the roadmap and sprint tracker for the Ikki ERP development lifecycle. The project is divided into distinct, manageable phases designed to prevent scope creep and ensure systematic delivery. Each phase is estimated for 1 to 2 weeks of development effort depending on team capacity.

---

## Phase 1: Infrastructure & Core Setup (Week 1)

**Objective**: Establish a robust Monorepo architecture, configure high-performance development tooling (Linters/Formatters), and initialize the foundational Layer 0 database schemas.

| Status | Task ID  | Description                                                                            | Component | Dependency |
| :----: | :------- | :------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `INF-01` | Initialize Bun Workspaces for `apps/web`, `apps/server`, and `packages/api`.           | Monorepo  | -          |
|   ⏳   | `INF-02` | Implement Oxlint & Oxfmt for optimized workspace validation.                           |  Config   | `INF-01`   |
|   ⏳   | `INF-03` | Establish standard OpenAPI specifications & Shared Zod Schemas within `packages/api`.  |  Backend  | `INF-01`   |
|   ⏳   | `DB-01`  | Design and generate Drizzle schemas for Master Data (`locations`, `materials`, `uom`). |  Backend  | -          |
|   ⏳   | `WEB-01` | Scaffold frontend utilizing Vite, React 19, Tailwind v4, Base UI, and TanStack Router. | Frontend  | -          |

---

## Phase 2: IAM & Master Data (Week 2 - 3)

**Objective**: Implement system security via Role-Based Access Control (RBAC) and develop the core application interfaces for location and material management.

| Status | Task ID  | Description                                                                         | Component | Dependency |
| :----: | :------- | :---------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `IAM-01` | Develop Auth Router (JWT) and RBAC Drizzle schemas.                                 |  Backend  | `INF-03`   |
|   ⏳   | `IAM-02` | Implement Login Page and protected routes managing state via Zustand.               | Frontend  | `WEB-01`   |
|   ⏳   | `MST-01` | Develop CRUD APIs for `locations` and `materials` (ensuring multi-UOM scale logic). |  Backend  | `DB-01`    |
|   ⏳   | `MST-02` | Build UI DataTables and TanStack Forms for Master Data management.                  | Frontend  | `MST-01`   |

---

## Phase 3: Inventory Engine (Week 4 - 5)

**Objective**: Construct the core warehouse operations module ensuring accurate tracking of stock movements, internal transfers, and physical adjustments.

| Status | Task ID  | Description                                                                            | Component | Dependency |
| :----: | :------- | :------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `INV-01` | Establish database schemas for `stock_movements` and `stock_summaries`.                |  Backend  | `MST-01`   |
|   ⏳   | `INV-02` | Develop transactional APIs for Inbound, Outbound, and Internal Transfers.              |  Backend  | `INV-01`   |
|   ⏳   | `INV-03` | Implement Stock Opname (Adjustment) service with strict supervisor approval workflows. |  Backend  | `INV-02`   |
|   ⏳   | `INV-04` | Construct Stock Movement Dashboards and Opname data entry forms.                       | Frontend  | `INV-02`   |

---

## Phase 4: Purchasing & Sales (Week 6 - 7)

**Objective**: Manage the lifecycle of procurement and sales. This phase isolates order authorization from physical inventory execution.

| Status | Task ID  | Description                                                                         | Component | Dependency |
| :----: | :------- | :---------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `PUR-01` | Develop API and UI for Purchase Requisition (PR) to Purchase Order (PO) conversion. | Fullstack | `MST-01`   |
|   ⏳   | `PUR-02` | Integrate Goods Receipt Note (GRN): Receiving triggers Inbound Stock automatically. | Fullstack | `INV-02`   |
|   ⏳   | `SAL-01` | Develop API and UI for Quotation to Sales Order (SO) conversion.                    | Fullstack | `MST-01`   |
|   ⏳   | `SAL-02` | Integrate Delivery Order (DO): Dispatching triggers Outbound Stock deduction.       | Fullstack | `INV-02`   |

---

## Phase 5: Manufacturing & Recipe (Week 8)

**Objective**: Automate the conversion of Raw Materials into Finished Goods via structured Bills of Materials (BOM).

| Status | Task ID  | Description                                                                             | Component | Dependency |
| :----: | :------- | :-------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `MFG-01` | Develop API and UI for managing Bills of Materials (BOM/Recipes).                       | Fullstack | `MST-01`   |
|   ⏳   | `MFG-02` | Implement Work In Progress (WIP) service: Record material consumption and yield output. | Fullstack | `INV-02`   |

---

## Phase 6: Analytics & Optimization (Week 9)

**Objective**: Deliver high-level management dashboards and secure optimal system performance across all modules.

| Status | Task ID   | Description                                                                             | Component | Dependency |
| :----: | :-------- | :-------------------------------------------------------------------------------------- | :-------: | :--------- |
|   ⏳   | `DASH-01` | Implement Upstash Redis caching layer for heavy data aggregations (e.g., COGS).         |  Backend  | All        |
|   ⏳   | `DASH-02` | Develop analytical charts via Recharts and review Sentry error tracking implementation. | Frontend  | All        |

---

### Status Legend

- `⏳` : To Do (Ready for development)
- `🏃` : In Progress (Currently under development)
- `✅` : Completed (Developed and passing verifications)
- `🛑` : Blocked (Awaiting external dependency or clarification)
