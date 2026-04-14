# Identity and Access Management (IAM)

The Identity and Access Management (IAM) module is the foundational security layer of Ikki ERP. It governs authentication, authorization, and resource access across Ikki Group's operations (Ikki Coffee, Ikki Resto, and Central Warehouses), ensuring that the right users have the right access to the right data.

## 1. Core Objectives

- **Centralized Security**: Single point of control for all user identities and permissions.
- **Data Isolation**: Robust operational data segregation via Location-Based Access Control (LBAC) to prevent data mixing between outlets.
- **Auditability**: Complete transparency into user actions and access lifecycle.
- **High Performance**: Optimized permission checks designed for low latency during peak restaurant hours.

## 2. User Hierarchy & Personas

### Root Accounts (Super Admin)

- **Scope**: Global access across all modules and all physical locations.
- **Capabilities**: Configuration of system-wide settings, management of other root accounts, and access to master data logs.
- **Use Case**: Business Owners (Owner) and General Managers.

### Standard Accounts (Non-Root)

- **Scope**: Context-aware access restricted to assigned **Locations** (Outlets or Warehouses).
- **Capabilities**: Defined by assigned **Roles**.
- **Constraint**: Users cannot see or interact with data outside their assigned outlet/warehouse unless explicitly granted "Cross-Location" permissions.

## 3. Key Features

### User Management

- **Lifecycle Management**: Create, Update, Deactivate (Soft-delete), and Archive users.
- **Security Status**: Real-time status monitoring (Active, Suspended, Locked).
- **Account Recovery**: Secure password reset flows and forced password changes on first login.

### Advanced Role-Based Access Control (RBAC)

- **Granular Permissions**: Permissions follow a strict `<modules>:<action>` naming convention (e.g., `invoices:create`, `inventories:transfer`). For maximum reliability, these are defined as runtime constants rather than plain strings to ensure end-to-end type safety.
- **Role Templates**: Pre-defined roles for common F&B personas (e.g., Barista, Chef, Cashier, Outlet Manager, Warehouse Staff).
- **Hierarchical Roles**: Ability to inherit permissions from parent roles to simplify management.

### Location-Based Access Control (LBAC)

- **Contextual Access**: Users are bound to specific `LocationID`s. All database queries are automatically filtered based on the active user's location context.
- **Multi-Location Assignment**: Support for users who manage or work across multiple outlets (e.g., Area Manager, hybrid staff).

## 4. High-Performance Architecture (Proposed)

### Performance Optimization

- **Permission Caching**: Store resolved permission sets in memory (Redis) to avoid heavy database joins on every API request.
- **Bitmask Permissions**: Use bitwise operations for ultra-fast authorization checks in the middleware.
- **Token Strategy**: Implementation of stateless JWT (JSON Web Tokens) with short TTL for access tokens and robust Refresh Token rotation.

### Security Standards

- **Password Policies**: Argon2id hashing for superior computational resistance.
- **MFA Ready**: Architecture supports Multi-Factor Authentication (TOTP/SMS) for future integration.

## 5. Roadmap & Next Phase Recommendations

1.  **Comprehensive Audit Logs**: Every IAM change (role creation, permission update) should be immutable and searchable.
2.  **Session Management Dashboard**: Allow Root users to view active sessions and remotely terminate them ("Logout from all devices").
3.  **Automatic Provisioning**: Integration with HR modules to auto-create accounts based on employee onboarding.
