# Constraints & FK Strategy

Foreign key behaviors, check constraints, soft-delete, and enum rules.

---

## Foreign Key onDelete

| Behavior | When to Use | Example |
|----------|-------------|---------|
| `cascade` | Child owned by parent | order_items → orders |
| `restrict` | Parent is a dependency | materials → categories |
| `set null` | Optional/historical reference | order_items → products |

Rules:
- Every FK explicitly declares `onDelete`. No implicit defaults.
- `restrict` is the safe default for master data.
- `cascade` only for true ownership (header → lines).
- `set null` for historical integrity (product deleted, order item stays).

## Check Constraints

| Pattern | Expression | Example |
|---------|-----------|---------|
| Non-negative | `gte(col, 0)` | Financial amounts |
| Positive | `gt(col, 0)` | Line item quantities |
| Range | `between(col, min, max)` | Tax rate [0, 100] |
| XOR | `or(and(isNotNull(a), isNull(b)), ...)` | Recipe target |
| Not-equal | `ne(colA, colB)` | Transfer src != dest |
| Conditional | `or(isNull(x), and(gte(x, y), ...))` | Stock range when max is set |

Naming: `{table}_{description}_chk`

## Soft Delete

- Implemented via `deleted_at` / `deleted_by` (part of `auditFullColumns`).
- `deleted_at IS NULL` = active record.
- Unique indexes on soft-deletable tables are partial: `.where(isNull(t.deletedAt))`.
- Service layer enforces soft-delete; repos set `deletedAt`, never hard-delete.

## Enum Strategy

| Type | Location | Rule |
|------|----------|------|
| Domain-specific | Same file as table | Default |
| Cross-domain | `_enums.ts` | Only if used by 2+ unrelated domains |

Current shared enum: `invoiceStatusEnum` (sales + purchasing invoices).

Rules:
- Values are lowercase: `'open'`, `'closed'`, `'void'`.
- Add new values via migration — never modify existing.
- Don't duplicate enums. Promote to `_enums.ts` when genuinely shared.
