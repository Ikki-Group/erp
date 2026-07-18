# Column Standards

Patterns for primary keys, audit stamps, numerics, booleans, timestamps, and JSONB.

---

## Primary Keys

```typescript
export const pk = { id: serial('id').primaryKey() } as const       // default
export const pkUUID = { id: uuid('id').primaryKey() } as const     // reserved, unused
```

- Use `...pk` spread in every table. Never composite PKs.

## Audit Columns

| Pattern | Columns | Use For |
|---------|---------|---------|
| `auditBasicColumns` | created_at, updated_at, created_by, updated_by | Master data, config, simple entities |
| `auditFullColumns` | audit_basic + deleted_at, deleted_by | Transactional data needing soft-delete |
| None | — | System tables (sessions, audit_logs) |

## Numeric Precision

| Scale | Type | Use |
|-------|------|-----|
| `numeric(18,2)` | Financial | amounts, prices, costs (IDR/fiat) |
| `numeric(18,6)` | Quantity | stock qty, conversions, ingredients |
| `numeric(5,2)` | Percentage | tax rate, scrap %, bounded [0-100] |

Never use `float`/`double` for money or quantities.

## Timestamps

| Pattern | Type | Example |
|---------|------|---------|
| All timestamps | `timestamptz` + `mode: 'date'` | `created_at`, `transaction_date` |
| Date-only | `date` + `mode: 'date'` | `stock_summaries.date` |
| Time-only | `time` | `shifts.start_time` |

Default: `.defaultNow()` for creation timestamps. Always `withTimezone: true`.

## Booleans

| Prefix | Meaning | Default |
|--------|---------|---------|
| `is_active` | Soft-disable | `true` |
| `is_system` | Seeder-created, immutable | `false` |
| `is_default` | Selected default | `false` |
| `has_*` | Feature flag | `false` |

Always `notNull()` with explicit default. Never nullable booleans.

## JSONB

Use for variable-structure data only. Rules:
- Define TypeScript type with `.$type<T>()`.
- Always nullable (no `.notNull()`).
- Never store relational data that should be a normalized FK.

| Table | Column | Purpose |
|-------|--------|---------|
| sales_orders | metadata | Third-party sync data |
| location_payment_methods | credentials | Provider secrets |
| location_payment_methods | config | Per-location payment config |
| audit_logs | old/new_value | Change tracking |
