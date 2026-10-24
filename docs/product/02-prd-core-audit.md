# PRD: Audit Trail

Comprehensive mutation logging — every create, update, and delete is recorded with old/new values.

## Overview

Two layers of tracking:

1. **Audit stamps** — `created_at`, `created_by`, `updated_at`, `updated_by` on every mutable table. Quick "who last touched this" answer.
2. **Audit log** — separate event table recording every mutation with full detail. Queryable via UI.

## Audit Log Record

| Field      | Type      | Description                                                          |
| ---------- | --------- | -------------------------------------------------------------------- |
| id         | serial    | PK                                                                   |
| timestamp  | timestamp | When the action occurred                                             |
| userId     | FK        | Who performed it                                                     |
| userName   | string    | Snapshot of user's name (for display without join)                   |
| locationId | FK?       | Active location context (null for global actions)                    |
| module     | string    | Module name (e.g. `pos`, `inventory`, `iam`)                         |
| entity     | string    | Entity name (e.g. `order`, `material`, `user`)                       |
| entityId   | integer   | ID of the affected record                                            |
| action     | enum      | `create`, `update`, `delete`                                         |
| summary    | string    | Human-readable summary (e.g. "Voided order ORD-COFFEE-20260806-003") |
| oldValues  | jsonb?    | Previous field values (null for create)                              |
| newValues  | jsonb?    | New field values (null for delete)                                   |
| metadata   | jsonb?    | Extra context (e.g. `{ reason: "customer complaint" }`)              |

## What Gets Logged

**Everything.** Every mutation (create, update, delete/deactivate) on every entity generates an audit log entry.

### Examples

| Action          | Summary                                  | oldValues                  | newValues                      |
| --------------- | ---------------------------------------- | -------------------------- | ------------------------------ |
| Create order    | "Created order ORD-COFFEE-20260806-001"  | null                       | `{ status: "open", total: 0 }` |
| Void order      | "Voided order ORD-COFFEE-20260806-001"   | `{ status: "completed" }`  | `{ status: "voided" }`         |
| Update price    | "Updated Iced Latte price"               | `{ base_price: 25000 }`    | `{ base_price: 28000 }`        |
| Stock adjust    | "Adjusted Espresso Beans at Coffee"      | `{ quantity: 5.2 }`        | `{ quantity: 4.8 }`            |
| Deactivate user | "Deactivated user john@ikki.id"          | `{ is_active: true }`      | `{ is_active: false }`         |
| Approve payroll | "Approved payroll PAY-COFFEE-202608-001" | `{ status: "calculated" }` | `{ status: "approved" }`       |

## Old/New Values

- **Create:** `oldValues` = null, `newValues` = all fields of the new record.
- **Update:** `oldValues` = only changed fields (before), `newValues` = only changed fields (after).
- **Delete:** `oldValues` = key fields of deleted record, `newValues` = null.

Unchanged fields are NOT included in update entries (reduce noise).

## UI: Activity Log

### Features

- Filterable by:
  - Date range
  - User (who did it)
  - Module (pos, inventory, finance, etc.)
  - Entity type (order, material, user, etc.)
  - Action (create, update, delete)
  - Location
- Sortable by timestamp (newest first default).
- Searchable by summary text.
- Detail view: expand to see full old/new values.
- Accessible to: `owner` only (permission: `audit:log:read`).

### Permission

| Permission       | Description                |
| ---------------- | -------------------------- |
| `audit:log:read` | View audit log (UI access) |

Default: only `owner` role has this. Can be assigned to custom roles.

## Performance Considerations

- Audit log is **append-only** (never update, never delete).
- Indexes: `(timestamp)`, `(entity, entity_id)`, `(user_id, timestamp)`, `(module, timestamp)`.
- Old/new values stored as JSONB (flexible, no schema migration needed when entities change).
- Retention: unlimited for now. Future: archive to cold storage after X months if needed.
- Audit log writes are **async** (non-blocking) — if audit insert fails, the main transaction still succeeds.

## What Is NOT Logged

- Read operations (viewing lists, detail pages).
- Login/logout (handled by session management, not audit log).
- Failed attempts (401/403 — handled by security logging, not business audit).
- Auto-generated events without user action (e.g. cron jobs, scheduled tasks).

## Implementation Notes

- Middleware/hook pattern: service layer calls `auditLog.record(...)` after successful mutation.
- Summary is auto-generated from a template per entity+action.
- `userName` is denormalized to avoid joins on audit queries (user might be deactivated later).

---

**Next:** [03-prd-master-data.md](./03-prd-master-data.md) — Materials, UoM, Suppliers.
