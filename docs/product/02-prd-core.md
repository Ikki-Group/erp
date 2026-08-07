# PRD: Core Modules

Specifications for Location, IAM (users, roles, permissions), Authentication, and Company Settings.

## Location

### Purpose

The fundamental operational unit. Every transaction, stock record, shift, and report is scoped to a location. Users switch context by selecting a location.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| code | string | Unique short code (e.g. "COFFEE", "RESTO", "WH-A") |
| name | string | Display name ("Ikki Coffee", "Gudang Pusat A") |
| type | enum | `store`, `warehouse` |
| address | string? | Physical address |
| phone | string? | Contact number |
| isActive | boolean | Active/inactive toggle |

### Location Types

| Type | Has POS | Has Inventory | Has Menu | Description |
|------|---------|---------------|----------|-------------|
| `store` | Yes | Yes | Yes | Sells to customers + stores operational stock |
| `warehouse` | No | Yes | No | Bulk storage, distribution to stores |

### Topology

```
Ikki Group
├── Ikki Coffee       (store)  — POS + stok operasional
├── Ikki Resto        (store)  — POS + stok operasional
├── Gudang Pusat A    (warehouse) — bulk storage
└── Gudang Pusat B    (warehouse) — bulk storage
```

### Context Switcher (UI)

```
[🔽 Ikki Coffee ▾]
├── 📊 Semua              (owner only — aggregate view)
├── ───────────────
├── Ikki Coffee           (store)
├── Ikki Resto            (store)
├── ───────────────
├── Gudang Pusat A        (warehouse)
└── Gudang Pusat B        (warehouse)
```

Menu/sidebar adapts based on location type:
- `store` → full menu (POS, Inventory, Sales, Menu, etc.)
- `warehouse` → inventory only (Stock, Transfers, Receiving, Opname)
- `Semua` → aggregate dashboard, cross-location reports

### Business Rules

- Code is unique and immutable after creation.
- Cannot deactivate a location with stock balance > 0 (must transfer out first).
- At least one store must be active.
- Location determines: what data user sees, what they can create, what reports show.

## IAM (Identity & Access Management)

### Purpose

Manage users, roles, and permissions. Every API call is authenticated and authorized.

### Entities

| Entity | Description |
|--------|-------------|
| User | System user with credentials |
| Role | Named permission set (e.g. "Manager", "Cashier") |
| Permission | Granular action (e.g. `pos:order:create`, `inventory:transfer:approve`) |
| Location Assignment | Maps user → role → location(s) they can access |

### Default Roles

| Role | Scope | Description |
|------|-------|-------------|
| owner | Global (all locations) | Full access to everything |
| manager | Per-location | Manages specific locations: stock, sales, staff |
| cashier | Per-location | POS operations, shift open/close |
| warehouse_staff | Per-location (warehouse) | Stock receiving, transfers, opname |
| accountant | Global | Finance module: journals, reports |

### Business Rules

- A user can have different roles at different locations.
- A user can work at multiple locations (assigned to each).
- At least one user must have `owner` role at all times.
- Soft-delete users (preserve audit trail).
- Permission format: `{module}:{entity}:{action}`.
- System roles (`owner`) are immutable.

## Authentication

### Flows

| Flow | Method |
|------|--------|
| Login | Username/email + password → session token |
| Logout | Invalidate session |
| Session refresh | Extend before expiry |
| Password change | Requires current password |

### Session Model

- Server-side sessions in Redis.
- Session token as HTTP-only cookie.
- TTL: 7 days active, 30 min idle timeout (configurable).
- Session stores: userId, active locationId, role context.

### Location Context in Session

When user switches location in the UI:
1. Frontend sends location switch request.
2. Backend validates user has access to that location.
3. Session updates `activeLocationId`.
4. All subsequent API calls are scoped to that location.

## Company Settings

### Purpose

Global configuration for Ikki Group — applies across all locations.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | Business name ("Ikki Group") |
| address | string? | Head office address |
| phone | string? | Contact phone |
| email | string? | Contact email |
| taxId | string? | NPWP |
| taxRate | decimal | Default tax rate (%) |
| currencyCode | string | ISO currency (IDR) |
| currencySymbol | string | Display symbol (Rp) |
| logoUrl | string? | Company logo |
| receiptFooter | string? | Default receipt text |

### Business Rules

- Singleton record — only one exists.
- Only `owner` can modify.
- Currency cannot change after first financial transaction is posted.

---

**Next:** [03-prd-master-data.md](./03-prd-master-data.md) — Materials, UoM, Suppliers.
