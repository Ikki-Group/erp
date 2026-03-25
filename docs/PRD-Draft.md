# Product Requirements Document (PRD): Ikki ERP

## 1. Executive Summary
**Purpose**: To define the architectural foundation and core modules of the Ikki ERP system, providing a definitive single source of truth for business operations.

**Problem Statement**: Current operational workflows depend on disconnected tools, causing fragmented data across departments, inefficiencies in physical tracking, and delayed decision-making.
**Proposed Solution**: A modern, high-performance web application constructed on ElysiaJS and React 19. This platform will centralize Master Data, Inventory, Purchasing, Sales, and Manufacturing into a unified, integrated system.
**Business Impact**: 
- Eliminate redundant data entry across distinct departments.
- Ensure real-time visibility into inventory stock levels and production statuses.
- Deliver high system reliability through robust end-to-end type safety.

---

## 2. Problem Definition

### 2.1 User and Operational Challenges
- **Target Audience**: Internal personnel including Administrators, Warehouse Staff, Purchasing Officers, Sales Representatives, and Production Managers.
- **Current Issues**: Data is heavily siloed. Physical stock counting (Opname) relies on manual data input, increasing error margins. The purchasing division lacks immediate visibility into factory production requirements.
- **Root Cause**: The absence of a centralized relational database and standardized application interfaces.
- **Consequences**: Elevated operational overhead, increased order fulfillment times, and disjointed financial and inventory reporting.

### 2.2 Business Objectives
- **Efficiency Improvements**: Significantly reduce manual processing time and enforce automated cross-departmental data synchronization.
- **System Scalability**: Engineer a highly scalable architecture that supports the seamless addition of future modules (e.g., Finance, CRM, HR) without requiring core system refactoring.

---

## 3. Core Modules & Scope (MVP Phase 1)

This section details the primary modules included in the MVP release, covering foundational and operational business logic.

### 3.1 Master Data Management (Layer 0)
The underlying tier of the ERP. It stores relatively static records required by all transactional operations.

*   **1. Material / Product Data**
    *   **Categorization**: Hierarchical grouping of items (e.g., Raw Materials, Packaging, Finished Goods).
    *   **Unit of Measure (UOM) System**: Advanced continuous conversion logic (e.g., 1 Pallet = 100 Boxes, 1 Box = 10 Packs).
    *   **Minimum Stock Thresholds**: Automated low-stock alerts triggered when physical inventory breaches predefined limits.
*   **2. Location Management**
    *   **Hierarchical Structure**: Capable of supporting Warehouse, Zone, Rack, and Bin designations.
    *   **Location Classifications**: Distinct types including Internal Storage, Transit/Shipping, and Virtual (designated for lost or damaged goods).
*   **3. Business Partners**
    *   Centralized registry for Vendors and Customers containing critical contact details, billing addresses, and structured Payment Terms.

### 3.2 Identity & Access Management (Layer 1)
Centralized security and user authorization protocols.

*   **1. Authentication**
    *   Secure standard login utilizing JWT architecture (Access and Refresh Tokens).
*   **2. Role-Based Access Control (RBAC)**
    *   Strict, granular permission settings (Create, Read, Update, Delete, Approve) bound to designated user Roles.
*   **3. Audit Logging (Traceability)**
    *   Mandatory database tracking of `created_by` and `updated_at` properties across all tables. Hard deletions are restricted in favor of Soft-Delete/Void mechanisms to preserve historical data integrity.

### 3.3 Inventory Operations (Layer 2)
The core transactional engine ensuring accurate physical item traceability.

*   **1. Stock Movements**
    *   **Inbound**: Receiving operations structurally linked to Purchasing records (GRN).
    *   **Outbound**: Issuing operations structurally linked to Sales (DO) or Manufacturing consumption.
    *   **Internal Transfer**: Documented relocation of stock between registered internal locations.
*   **2. Stock Opname (Adjustments)**
    *   Generation of systematic cycle-counting sheets.
    *   Data entry comparison between system records and actual physical counts.
    *   Stock adjustment transactions mandate formal Supervisor approval before enacting database modifications.

### 3.4 Purchasing & Procurement
Administers the data flow of supply acquisition, from planning to warehouse reception.

*   **1. Purchase Requisition (PR)**
    *   Internal item request documentation with multi-tier managerial approval workflows.
*   **2. Purchase Order (PO)**
    *   The formalized vendor contract detailing item quantities, negotiated prices, taxes, and anticipated lead times.
*   **3. Goods Receipt Note (GRN)**
    *   Physical warehouse receiving process. The system strictly prevents receiving quantities that exceed the authorized PO amount, concluding the PO lifecycle upon fulfillment.

### 3.5 Sales & Distribution
Administers the client fulfillment operations.

*   **1. Quotation**
    *   System-generated business proposals for prospective client engagement.
*   **2. Sales Order (SO)**
    *   Confirmed client orders. Approving an SO conceptually allocates required inventory to prevent overselling.
*   **3. Delivery Order (DO)**
    *   Dispatch instructions directing warehouse staff to fulfill the SO. System inventory is deducted definitively once the DO status is finalized to 'Shipped'.

### 3.6 Manufacturing & Production
Manages the transformation of Raw Materials into Finished Goods.

*   **1. Bill of Materials (BOM)**
    *   Structured definition determining exact material requirements to produce a single finished good. Supports multi-level component structuring.
*   **2. Production Orders**
    *   Tracks the manufacturing lifecycle across distinct phases (Planned, In Progress, Quality Control, Completed).
*   **3. Usage and Yield Automation**
    *   Automatically deducts consumed raw materials from designated factory locations and registers the yielded finished products back into inventory.

---

## 4. Design & User Experience

### 4.1 Interface Principles
- **Information Density**: The interface will be optimized for desktop administration, prioritizing compact data visualization and minimizing excessive whitespace to reduce user scroll fatigue.
- **Operational Speed**: The application will support extensive keyboard navigation and optimized data-entry forms to facilitate rapid operational usage.

### 4.2 UI Technology Stack
- **Styling**: Tailwind CSS v4 utilizing the new `@tailwindcss/vite` compiler.
- **Components**: Combination of Base UI and Shadcn/UI for robust, accessible UI primitives.
- **Data Grids**: TanStack Form and TanStack Table for performant handling of complex, multi-line document interactions.
- **Data Visualization**: Recharts for generating analytical management dashboards.
- **Monitoring**: Sentry implementation for proactive application error tracking.

---

## 5. System Architecture
- **Repository Strategy**: Bun Workspaces will be implemented to facilitate structural module sharing across the Monorepo.
- **Backend Infrastructure**: ElysiaJS paired with Drizzle ORM running on PostgreSQL. The application relies heavily on strict Layer 0 to Layer 3 hierarchical domains to guarantee maintainability.
- **Frontend Infrastructure**: React 19 over Vite, managing complex client state via Zustand and server state via TanStack Query.
- **API Standards**: Strict adherence to standard OpenAPI/Swagger specifications referencing shared Zod schemas. This approach ensures excellent TypeScript Language Server performance without complicating client implementations.
