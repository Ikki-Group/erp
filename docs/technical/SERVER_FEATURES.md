# Ikki ERP Server Features

## Overview

The Ikki ERP server is organized into feature-based modules with a layered architecture. Each module follows a standardized structure with ServiceModule, routes, DTOs, repositories, and services.

## Module Architecture

### Layer 0 — Core

These modules are foundational and have no dependencies on other modules.

#### Location Module (`/location`)

- **LocationMaster**: Manage business locations, outlets, and warehouses
- Supports different location types (outlet, warehouse, etc.)
- Location filtering and CRUD operations

#### Product Module (`/product`)

- **ProductCategory**: Manage product categories hierarchy
- **Product**: Manage products with variants, prices, and external mappings
- Product filtering, selection, and management operations

### Layer 1 — Masters

These modules depend on Layer 0 and provide master data management.

#### IAM Module (`/iam`)

Identity and Access Management

- **Role**: Role-based access control with permissions
- **User**: User management with location assignments
- **Session**: Session management for authentication
- **Assignment**: User-location and user-role assignments

#### Material Module (`/material`)

Raw materials and ingredients management

- **MaterialCategory**: Material categorization
- **MaterialMaster**: Material definition with UoM
- **MaterialUom**: Unit of measurement definitions
- Depends on Location module

#### Supplier Module (`/supplier`)

- **Supplier**: Supplier/partner management
- Contact information and business details

#### Finance Module (`/finance`)

Financial accounting and bookkeeping

- **Account**: Chart of accounts management
- **GeneralLedger**: Journal entries and ledger management
- **Expenditure**: Expense tracking and categorization

#### CRM Module (`/crm`)

Customer Relationship Management

- Customer management and interactions

#### Company Module (`/company`)

- Company profile and business information
- Company settings and configuration

#### Audit Module (`/audit`)

- Audit trail and change tracking
- Activity logging and monitoring

#### HR Module (`/hr`)

Human Resources management

- **Employee**: Employee records and information
- **Payroll**: Payroll processing
- **LeaveRequest**: Leave management
- Depends on Finance module

### Layer 1.5 — Authentication

Depends on IAM module for authentication flows.

#### Auth Module (`/auth`)

- Authentication and authorization
- Login/logout operations
- Token management

### Layer 2 — Operations

These modules handle business operations and transactions.

#### Inventory Module (`/inventory`)

Inventory and stock management

- **StockTransaction**: Track all stock movements (in/out/transfer/adjustment)
- **StockSummary**: Aggregate stock levels across locations
- **StockAlert**: Low stock and reordering alerts
- **StockDashboard**: Inventory KPIs and metrics
- **StockTransfer**: Stock transfers between locations
- Depends on Material module

#### Recipe Module (`/recipe`)

Recipe and formulation management

- Recipe definitions for production
- Ingredient lists and quantities

#### Sales Module (`/sales`)

Sales and order management

- **SalesOrder**: Sales order processing
- **SalesInvoice**: Invoice generation and management
- **SalesType**: Different sales channels/types

#### Purchasing Module (`/purchasing`)

Procurement and purchasing

- Purchase order management
- Supplier ordering workflows
- Depends on Inventory module

#### Moka Module (`/moka`)

Third-party integration with Moka POS system

- **Configuration**: Moka API credentials and settings
- **Scrap**: Data synchronization from Moka (products, categories, sales)
- **ScrapHistory**: Sync history and tracking
- **SyncCursor**: Incremental sync cursor management
- **Transformation**: Data transformation for finance integration
- Depends on Finance module

### Layer 3 — Aggregators

These modules provide aggregate views and cross-functional features.

#### Production Module (`/production`)

Production and manufacturing

- Production order management
- Material consumption tracking
- Depends on Recipe and Inventory modules

#### Dashboard Module (`/dashboard`)

- Business intelligence dashboards
- KPIs and metrics visualization
- Cross-module data aggregation
- Depends on IAM, Location, Finance, and Sales modules

#### Tool Module (`/tool`)

Utility and helper services

- Reference data lookups
- Cross-module data access utilities
- Provides access to various master data services

#### Payment Module (`/payment`)

- Payment processing and tracking
- Payment method management
- Transaction recording

#### Reporting Module (`/reporting`)

- Report generation and analytics
- Cross-module reporting capabilities
- Data export functionality

## Route Structure

All routes are registered through the route registry in `/src/modules/_routes.ts` with the following prefixes:

- `/auth` - Authentication endpoints
- `/iam` - Identity and access management
- `/dashboard` - Dashboard and analytics
- `/inventory` - Inventory management
- `/location` - Location management
- `/material` - Material management
- `/product` - Product management
- `/recipe` - Recipe management
- `/tool` - Utility endpoints
- `/moka` - Moka integration
- `/sales` - Sales operations
- `/supplier` - Supplier management
- `/finance` - Finance operations
- `/crm` - Customer management
- `/company` - Company settings
- `/audit` - Audit logging
- `/purchasing` - Purchasing operations
- `/production` - Production management
- `/hr` - Human resources
- `/payment` - Payment processing
- `/reporting` - Reports

## Technology Stack

- **Framework**: Elysia (Bun-based web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: BentoCache
- **Logging**: LogTape with OpenTelemetry integration
- **Validation**: Zod
- **Authentication**: Session-based with JWT

## Module Dependencies Graph

```
Layer 0 (Core)
├── Location
└── Product

Layer 1 (Masters)
├── IAM (depends on Location)
├── Material (depends on Location)
├── Supplier
├── Finance
├── CRM
├── Company
├── Audit
└── HR (depends on Finance)

Layer 1.5 (Auth)
└── Auth (depends on IAM)

Layer 2 (Operations)
├── Inventory (depends on Material)
├── Recipe
├── Sales
├── Purchasing (depends on Inventory)
└── Moka (depends on Finance)

Layer 3 (Aggregators)
├── Production (depends on Recipe, Inventory)
├── Dashboard (depends on IAM, Location, Finance, Sales)
├── Tool (depends on IAM, Location, Material, Sales)
├── Payment
└── Reporting
```

## Standard Module Structure

Each module follows this standardized structure:

```
module-name/
├── index.ts              # ServiceModule definition and route initialization
├── feature/
│   ├── feature.repo.ts   # Database repository
│   ├── feature.service.ts # Business logic
│   ├── feature.route.ts  # API routes
│   └── feature.dto.ts    # Data transfer objects
```

## Core vs Lib Separation

### core/ (Essential Infrastructure)

Contains core infrastructure that the application cannot function without:

- **database/** - Database layer (Drizzle ORM, query builders, conflict checker)
- **http/** - HTTP layer (auth, error handling, request/response)
- **cache/** - Caching infrastructure (BentoCache configuration and client)
- **logger.ts** - Logging (LogTape with OpenTelemetry integration)
- **otel.ts** - Observability (OpenTelemetry configuration)

### lib/ (Shared Utilities)

Contains shared utilities and helper functions:

- **utils/** - General utilities (collection, pagination, date, relation-map)
- **auth/** - Authentication utilities (password hashing and verification)
- **validation/** - Validation utilities (common schemas, response schemas)

## Caching Strategy

All modules implement caching through BentoCache with standardized cache keys:

- `CACHE_KEY_DEFAULT` pattern for consistency
- Cache invalidation on mutations
- Read-through caching for performance
