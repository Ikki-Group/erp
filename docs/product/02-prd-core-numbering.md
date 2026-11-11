# PRD: Number Generation

Auto-generated document numbers for all transactional records. Daily reset, location-prefixed.

## Format

```
{PREFIX}-{LOCATION_CODE}-{YYYYMMDD}-{SEQ}
```

| Part          | Source                               | Example                  |
| ------------- | ------------------------------------ | ------------------------ |
| PREFIX        | Fixed per document type              | `ORD`, `TRF`, `OPN`      |
| LOCATION_CODE | `locations.code`                     | `COFFEE`, `RESTO`, `WHA` |
| YYYYMMDD      | Date (local timezone)                | `20260806`               |
| SEQ           | Daily sequence, zero-padded 3 digits | `001`, `002`, `099`      |

## Document Types

| Document         | Prefix | Example                   |
| ---------------- | ------ | ------------------------- |
| Order            | `ORD`  | `ORD-COFFEE-20260806-001` |
| Transfer Request | `TRF`  | `TRF-WHA-20260806-003`    |
| Stock Opname     | `OPN`  | `OPN-RESTO-20260806-001`  |
| Journal Entry    | `JRN`  | `JRN-COFFEE-20260806-012` |
| Payroll Run      | `PAY`  | `PAY-COFFEE-202608-001`   |
| Receiving        | `RCV`  | `RCV-WHA-20260806-002`    |

## Rules

- Sequence resets to `001` every day per location per document type.
- Numbers are generated at creation time (not on save/complete).
- Numbers are immutable once assigned — never change, never reuse.
- If SEQ reaches 999 in one day, extend to 4 digits (`1000`, `1001`).
- Timezone for date component: Asia/Jakarta (WIB, UTC+7).

## Payroll Exception

Payroll runs are monthly, not daily. Format:

```
PAY-{LOCATION_CODE}-{YYYYMM}-{SEQ}
```

Example: `PAY-COFFEE-202608-001` (first payroll run for August 2026 at Coffee).

Company-wide payroll (no specific location): `PAY-ALL-202608-001`.

## Generation Strategy

```
On document creation:
  1. Determine prefix + location_code + date
  2. Query MAX(seq) for that combination today
  3. Increment by 1 (or start at 1 if none exists)
  4. Format with zero-padding
  5. Assign to record (unique constraint prevents duplicates)
```

Concurrency: handled via database sequence or atomic INSERT with retry on unique violation.

## Display

- Full number shown on receipts, reports, and document headers.
- Searchable — user can search by full number or partial (e.g. "20260806-003").
- Sortable by number (chronological within a location).

---

**Next:** [03-prd-master-data.md](./03-prd-master-data.md) — Materials, UoM, Suppliers.
