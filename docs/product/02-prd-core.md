# PRD: Core Modules

Specifications for IAM, Authentication, Company Settings, and Location — the foundational modules every other module depends on.

## IAM (Identity & Access Management)

### Purpose

Manage users, roles, and granular permissions. Every API call is authenticated and authorized.

### Entities

| Entity | Description |
| ------ | ----------- |
| User | System user with credentials (username, email, password hash) |
| Role | Named set of permissions (e.g. "Store Manager", "Finance") |
| Permission | Granular action (e.g. `inventory:stock:read`, `sales:order:create`) |
| User Assignment | Maps user → role → location(s) |

### Key features

- Role-based access control (RBAC) with location scoping.
- A user can have different roles at different locations.
- System roles (admin, owner) are immutable.
- Permission format: `{module}:{entity}:{action}` (e.g. `purchasing:order:approve`).

### Business rules

- At least one user must have the `owner` role at all times.
- Deleting a user soft-deletes (preserves audit trail).
- Password requirements: min 8 chars.
- Session expires after configurable idle timeout.

## Authentication

### Purpose

Handle login, session management, and token lifecycle.

### Flows

| Flow | Method |
| ---- | ------ |
| Login | Username/email + password → session token |
| Logout | Invalidate session |
| Refresh | Extend session before expiry |
| Password change | Requires current password |
| Password reset | Email-based (future) |

### Session model

- Server-side sessions stored in Redis.
- Session token returned as HTTP-only cookie + response body (for mobile).
- Configurable TTL (default: 7 days active, 30 min idle).

## Company Settings

### Purpose

Global configuration for the business entity — applies across all locations.

### Fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| name | string | Business legal name |
| address | string? | Head office address |
| phone | string? | Contact phone |
| email | string? | Contact email |
| taxId | string? | Tax registration number (NPWP) |
| taxRate | decimal | Default tax rate (%) |
| currencyCode | string | ISO currency (default: IDR) |
| currencySymbol | string | Display symbol (default: Rp) |
| logoUrl | string? | Company logo |
| invoiceFooter | string? | Default text on invoices |
| receiptFooter | string? | Default text on receipts |

### Business rules

- Only one company settings record exists (singleton).
- Only `owner` role can modify company settings.
- Currency cannot be changed after the first financial transaction is posted.

## Location

### Purpose

Represent physical operational locations (stores, warehouses, kitchens). Every transactional record is location-scoped.

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| code | string | Unique short code (e.g. "WH-01", "STORE-CBD") |
| name | string | Human-readable name |
| type | enum | `store`, `warehouse`, `kitchen`, `office` |
| address | string? | Physical address |
| phone | string? | Location contact |
| isActive | boolean | Active/inactive toggle |

### Key features

- Every stock record, sales order, and production order belongs to exactly one location.
- Users are assigned to locations via IAM (can access multiple).
- Inter-location stock transfers are explicit operations.
- Deactivating a location prevents new transactions but preserves history.

### Business rules

- Location code is unique and immutable after creation.
- At least one active location must exist.
- A location cannot be deactivated if it has pending (non-completed) transactions.

---

**Next:** [03-prd-master-data.md](./03-prd-master-data.md) — Master data modules.
