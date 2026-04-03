# Product Requirements Document (PRD): Ikki ERP

> **Version**: 1.1  
> **Last Updated**: 2026-03-26  
> **Changelog**:
>
> - `v1.1` (2026-03-26) — Added Product module separation, Moka POS integration section, architecture diagram, refined module scoping
> - `v1.0` (Initial) — Original draft with core module definitions

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

- **Target Audience**: Internal personnel including Administrators, Inventory Staff (Gudang Utama), Purchasing Officers, Outlet Managers, and Head Chefs/Baristas.
- **Current Issues**: Data is heavily siloed. Physical stock counting (Opname) relies on manual data input, increasing error margins. The purchasing division lacks immediate visibility into factory production requirements.
- **Root Cause**: The absence of a centralized relational database and standardized application interfaces.
- **Consequences**: Elevated operational overhead, increased order fulfillment times, and disjointed financial and inventory reporting.

### 2.2 Business Objectives

- **Efficiency Improvements**: Significantly reduce manual processing time and enforce automated cross-departmental data synchronization.
- **System Scalability**: Engineer a highly scalable architecture that supports the seamless addition of future modules (e.g., Finance, CRM, HR) without requiring core system refactoring.

---

## 3. Core Modules & Scope (MVP Phase 1)

This section details the primary modules included in the MVP release, covering foundational and operational business logic. Each module is assigned a **Layer** to define strict dependency boundaries.

### 3.1 Product Data Management (Layer 0 — Core)

A foundational tier containing product-level data structures that serve as reference points across all transactional operations. This module has **zero external dependencies**.

- **Product Registry**: Centralized product catalog with category hierarchy, SKU management, and external POS mappings.
- **Product Categories**: Hierarchical categorization for product grouping and reporting.
- **Sales Type Configuration**: Pricing and classification structures for different sales channels.

### 3.2 Master Data Management (Layer 0–1)

The underlying tier of the ERP storing relatively static records required by all transactional operations.

- **1. Location Management (Layer 0)**
  - **Hierarchical Structure**: Simplified flat structure supporting Warehouses and Outlets (e.g., Ikki Coffee, Ikki Resto).
  - **Location Classifications**: Distinct types including Internal Storage (Gudang/Kitchen) and POS/Display areas.
- **2. Material / Raw Material Data (Layer 1)**
  - **Categorization**: Hierarchical grouping of items (e.g., Raw Materials, Packaging, Semi-finished Goods).
  - **Unit of Measure (UOM) System**: Advanced continuous conversion logic (e.g., 1 Dus = 12 Botol, 1 Botol = 1000 ml).
  - **Minimum Stock Thresholds**: Automated low-stock alerts triggered when physical inventory breaches predefined limits.
  - **Material-Location Binding**: Assignment and stock configuration per material per location.
- **3. Business Partners (Future)**
  - Centralized registry for Vendors and Customers containing critical contact details, billing addresses, and structured Payment Terms.

### 3.3 Identity & Access Management (Layer 1–1.5)

Centralized security and user authorization protocols.

- **1. Authentication (Layer 1.5)**
  - Secure standard login utilizing JWT architecture (Access and Refresh Tokens).
  - Auth layer depends on IAM for user lookup and validation.
- **2. Role-Based Access Control (RBAC) (Layer 1)**
  - Strict, granular permission settings (Create, Read, Update, Delete, Approve) bound to designated user Roles.
  - User-to-location assignment for multi-warehouse access control.
- **3. Audit Logging (Traceability)**
  - Mandatory database tracking of `created_by` and `updated_at` properties across all tables. Hard deletions are restricted in favor of Soft-Delete/Void mechanisms to preserve historical data integrity.

### 3.4 Inventory Operations (Layer 2)

The core transactional engine ensuring accurate physical item traceability. Depends on **Material** services.

- **1. Stock Movements**
  - **Inbound**: Receiving operations structurally linked to Purchasing records (GRN).
  - **Outbound**: Issuing operations structurally linked to Sales (DO) or Manufacturing consumption.
  - **Internal Transfer**: Documented relocation of stock between registered internal locations.
- **2. Stock Opname (Adjustments)**
  - Generation of systematic cycle-counting sheets.
  - Data entry comparison between system records and actual physical counts.
  - Stock adjustment transactions mandate formal Supervisor approval before enacting database modifications.
- **3. Stock Summary & Ledger**
  - Daily stock summary generation with Weighted Average Cost (WAC) calculation.
  - Material ledger supporting consolidated cross-location views.

### 3.5 Recipe & Bill of Materials (Layer 2)

Manages the transformation definitions of Raw Materials into Finished Goods.

- **1. Bill of Materials (BOM)**
  - Structured definition determining exact material requirements to produce a single finished good. Supports multi-level component structuring.
- **2. Recipe Cost Calculator**
  - Auto-calculate total recipe cost based on current material prices.

### 3.6 Sales & Distribution (Layer 2)

Administers the client fulfillment operations.

- **1. Sales Order (SO)**
  - Confirmed client orders. Approving an SO conceptually allocates required inventory to prevent overselling.
- **2. Delivery Order (DO)** _(future)_
  - Dispatch instructions directing warehouse/outlet staff to fulfill the SO. System inventory is deducted definitively once the DO status is finalized to 'Shipped'.

### 3.7 Purchasing & Procurement _(Planned)_

Administers the data flow of supply acquisition, from planning to warehouse reception.

- **1. Purchase Requisition (PR)**
  - Internal item request documentation with multi-tier managerial approval workflows.
- **2. Purchase Order (PO)**
  - The formalized vendor contract detailing item quantities, negotiated prices, taxes, and anticipated lead times.
- **3. Goods Receipt Note (GRN)**
  - Physical warehouse receiving process. The system strictly prevents receiving quantities that exceed the authorized PO amount, concluding the PO lifecycle upon fulfillment.

### 3.8 External Integrations — Moka POS (Layer 3 — Aggregator)

Integration engine connecting the ERP with external Point-of-Sale systems. This module operates at the **Aggregator** layer, consuming data from lower-level modules without being consumed by them.

- **1. Moka POS Sync Engine**
  - Authenticated connection to Moka POS API (OAuth-based).
  - Product, Category, and Sales data scraping from the external system.
  - Configurable sync settings per-outlet.
- **2. Scrap & Waste History**
  - Track scrap/waste events from POS operations for reconciliation with inventory.
- **3. Data Transformation**
  - Map external POS product IDs to internal ERP product registry for unified reporting.

### 3.9 Dashboard & Analytics (Layer 3 — Aggregator)

High-level management dashboards aggregating cross-module data.

- **KPI Cards**: Revenue, COGS, stock value, low stock count, top products.
- **Charts**: Revenue trend, stock movement, material usage (via Recharts).
- **Location-based Views**: Dashboard per-location or consolidated view.

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

### 5.1 Overview

The system follows a **Monorepo Architecture** orchestrated by Bun Workspaces, enforcing strict domain-layered dependency injection across all modules.

- **Repository Strategy**: Bun Workspaces with `apps/server`, `apps/web`, and `packages/*` workspaces.
- **Backend Infrastructure**: ElysiaJS paired with Drizzle ORM running on PostgreSQL (Neon Serverless). The application relies heavily on strict Layer 0 to Layer 3 hierarchical domains to guarantee maintainability.
- **Frontend Infrastructure**: React 19 over Vite, managing complex client state via Zustand and server state via TanStack Query.
- **API Standards**: Lightweight HTTP client (Ky) mapped against Zod schemas. OpenAPI/Swagger specifications for API documentation.

### 5.2 Layer Dependency Graph

```
Layer 3 (Aggregators)    → dashboard, tool, moka
  ↓ depends on
Layer 2 (Operations)     → inventory, recipe, sales
  ↓ depends on
Layer 1.5 (Security)     → auth
  ↓ depends on
Layer 1 (Masters)        → iam, materials
  ↓ depends on
Layer 0 (Core)           → location, product
```

> **Rule**: A module in a lower layer MUST NEVER import from a higher layer. This is validated via `dpdm` circular dependency checks.
