# Ikki ERP Development Timeline & Tracker

> **Version**: 3.0  
> **Last Updated**: 2026-04-03  
> **Changelog**:
>
> - `v3.0` (2026-04-03) — Project Reboot: Massive refactoring plan ignoring existing code constraints. Redefined strict Dependency Graph (Layer 0 to Layer 3). Finalized strategies: Monolithic SPA, in-memory caching, inclusion of data migration scripts, and moving Asset & B2B modules to Backlog.
> - `v2.0` (2026-03-28) — Completely realigned phases to match Ikki F&B specific module blueprints.
> - `v1.1` (2026-03-26) — Synced task statuses with actual codebase, added Moka integration.

This document serves as the roadmap and sprint tracker for the Ikki ERP development lifecycle, focusing on high standards, strict domain splitting, and enterprise best practices.

---

## Technical Strategy Decisions

- **Frontend Architecture**: Monolithic Single Page Application (SPA) utilizing TanStack Router for file-based routing. No Micro-frontends.
- **Analytics & Dashboarding**: Utilization of `cache-manager` with in-memory caching for the current phase to optimize analytical queries without external Redis overhead.
- **Data Continuity**: Dedicated phase for developing migration scripts to map old schema data into the newly restructured databases.
- **Release Scope**: Asset Maintenance and B2B Sales are designated as Backlog items to prioritize core operations for the MVP.

---

## MVP Core Refactoring & Implementation

### Phase 1: Architecture Reboot & Foundation (Layer 0)

**Objective**: Establish pristine Monorepo architecture, testing tools, and baseline foundation without dependencies.

| Status | Task ID  | Description                                                                          | Component |
| :----: | :------- | :----------------------------------------------------------------------------------- | :-------: |
|   ✅   | `INF-01` | Setup strict Monorepo (Bun), linter config (Oxlint/Oxfmt), `tsconfig` strict checks. |  Tooling  |
|   ✅   | `INF-02` | Standardize Drizzle Base Schemas, Zod validation pipelines, and Error Handling.      |  Config   |
|   ✅   | `MD-01`  | Rebuild Location Management (Outlets/Warehouse) module (Layer 0).                    |  Backend  |

### Phase 2: Master Data & Security (Layer 1)

**Objective**: Build central registries that depend only on Location and configuration.

| Status | Task ID  | Description                                                                    | Component |
| :----: | :------- | :----------------------------------------------------------------------------- | :-------: |
|   ✅   | `IAM-01` | Rebuild IAM Core: User, Role, Auth Engine, and LBAC middleware.                |  Backend  |
|   ✅   | `MD-02`  | Rebuild Core Catalogs: Product, Category, Material, and UOM Conversion Engine. |  Backend  |
|   ✅   | `MD-03`  | Develop Stakeholder Catalogs: Supplier Profiles (SRM) & Employee Master.       |  Backend  |
|   ✅   | `FIN-01` | Define structural Chart of Accounts (CoA) definitions.                         |  Backend  |

### Phase 3: Procurement & Inventory (Layer 2)

**Objective**: Transactional engines managing external supply and internal physical movements.

| Status | Task ID  | Description                                                                         | Component |
| :----: | :------- | :---------------------------------------------------------------------------------- | :-------: |
|   ✅   | `PUR-01` | Purchasing Workflow: Purchase Requisition $\rightarrow$ PO (with Price Lock).       |  Backend  |
|   ✅   | `PUR-02` | Goods Receipt Note (GRN) processing and invoice validation.                         |  Backend  |
|   ✅   | `INV-01` | Inventory Movement Engine: Stock In, Out, Internal Transfers.                       |  Backend  |
|   ✅   | `INV-02` | Material Ledger automation mapping real-time Weighted Average Cost (WAC) & Opnames. |  Backend  |

### Phase 4: Production & Costing (Layer 2)

**Objective**: Handling recipe hierarchies and kitchen processing.

| Status | Task ID  | Description                                                               | Component |
| :----: | :------- | :------------------------------------------------------------------------ | :-------: |
|   ✅   | `PRO-01` | Simple Recipe/BOM Master & Product costing (Simulated).                   |  Backend  |
|   ✅   | `PRO-02` | Work Order (WO) - Manual process stock deduction & finish good stock add. |  Backend  |

### Phase 5: HRIS Operations (Layer 2)

**Objective**: Full F&B staff lifecycle tracking.

| Status | Task ID | Description                                                                        | Component |
| :----: | :------ | :--------------------------------------------------------------------------------- | :-------: |
|   ✅   | `HR-01` | Time & Attendance: Shift scheduling and digital Clock-In/Out mechanics.            |  Backend  |
|   ⏳   | `HR-02` | Payroll Engine: Batch generation, manual adjustments, Service Charge distribution. |  Backend  |

### Phase 6: Core Aggregation & Financials (Layer 3)

**Objective**: External syncs and generating accounting truth.

| Status | Task ID   | Description                                                                            | Component  |
| :----: | :-------- | :------------------------------------------------------------------------------------- | :--------: |
|   ⏳   | `MOKA-01` | Implement Moka POS Integration: Sync catalogs, fetch transactions, and trace waste.    | Aggregator |
|   ⏳   | `FIN-02`  | Finance Sink: Double-entry General Ledger automation catching all module transactions. | Aggregator |
|   ⏳   | `MIG-02`  | Execute comprehensive Data Migration staging test from old schema to new structure.    |  Tooling   |

### Phase 7: Analytics & QA (Layer 3)

**Objective**: Front-facing executive dashboards and system-wide polishing.

| Status | Task ID   | Description                                                                         | Component |
| :----: | :-------- | :---------------------------------------------------------------------------------- | :-------: |
|   ⏳   | `DASH-01` | Managerial Dashboards (P&L, Top Sales) utilizing in-memory `cache-manager`.         | Fullstack |
|   ⏳   | `QA-01`   | End-to-End integration testing across all layered modules and validation pipelines. |  Tooling  |

---

## Backlog (Post-MVP Enhancements)

These modules are planned for future development cycles after the successful deployment of Phase 1-7.

| Priority | Module                   | Description                                                                            |
| :------: | :----------------------- | :------------------------------------------------------------------------------------- |
|   Low    | **Asset & Maint.**       | Fixed Asset Tagging, Maintenance scheduling, and auto-depreciation journals.           |
|   Low    | **B2B Sales**            | Wholesale logistics: Quotations, Delivery Orders, B2B Invoicing (Accounts Receivable). |
|   Low    | **Enterprise Workflows** | Implementing multi-step approval engines for critical transactions.                    |

---

### Status Legend

- `⏳` : To Do
- `🏃` : In Progress
- `✅` : Completed
- `🛑` : Blocked
