# UI Consistency Punch-List (#53)

Audit of the wired `apps/web` route screens against `.kiro/steering/ikki-design.md`.
Produced 2026-09-14. Findings are grouped by type; each is marked **FIXED** (landed in
this ticket), **FOLLOW-UP** (filed as its own ticket), or **OK/NOTED**.

## 1. Hard-coded semantic colors — FIXED

The steering forbids hard-coded color literals; status/money semantics must use the
semantic tokens (`text-success`/`text-destructive`/`text-warning`/`text-info`), which have
`.dark` counterparts. The hard-coded Tailwind palette classes did **not** — so these read
wrong in dark mode. All six occurrences replaced with tokens:

| File | Was | Now |
| --- | --- | --- |
| `features/pos/components/payment-dialog.tsx` | `text-green-600` (change) | `text-success` |
| `features/pos/components/order-cart.tsx` | `text-green-600` (discount) | `text-success` |
| `features/pos/components/order-receipt.tsx` | `text-green-600` (discount) | `text-success` |
| `features/pos/components/shift-close-form.tsx` | `text-green-600`/`text-red-600`/`text-amber-600` | `text-success`/`text-destructive`/`text-warning` |
| `features/inventory/components/opname-count-form.tsx` | `text-emerald-600`/`text-red-600` | `text-success`/`text-destructive` |
| `routes/_authenticated/pos/shifts.tsx` | `bg-green-500` (active dot) | `bg-success` |

Post-fix grep for `(text|bg|border|ring|fill|stroke)-<palette>-<n>` across `routes/`+`features/`
returns zero. This was the highest-value, most objective, most systemic finding.

## 2. Keyboard operability of clickable table rows — FIXED (in #52)

`reui/data-grid/data-grid-table.tsx` rows with `onRowClick` were mouse-only. Added
`role="button"` + `tabIndex={0}` + Enter/Space handler + focus-visible ring, gated on
`onRowClick`. Benefits every row-click list, not just the audit browser. (Landed under #52.)

## 3. Loading state on the UoM conversions sub-list — FOLLOW-UP

`routes/_authenticated/master/uom/index.tsx:285` renders the conversions sub-panel loading as
a bare `LoaderIcon animate-spin` + "Loading conversions..." rather than a skeleton. The steering
prefers skeletons over bare spinners. This is a secondary sub-panel (the primary UoM table
already uses the DataTable skeleton), so it's low-impact. File as a small follow-up rather than
touch it here.

_(Note: the spinner inside the login submit button — `routes/login.tsx:112` — is a correct
button-pending indicator, not a list-loading state. No change.)_

## OK / verified consistent (do not touch)

- **List loading/empty**: the list routes drive loading through `DataTable isLoading` (skeleton
  mode) and render composed `EmptyState`s; no bare-spinner list screens found.
- **Forms**: forms use `ui/field` + `Label`-above-input; no placeholder-as-label found in the
  spot check. Submit buttons state verbs.
- **Dashboard (#51)** and **audit (#52)**: loading/empty/error branches present per steering.

## Summary

- Fixed inline (this ticket): finding **1** (6 files) — systemic, safe, dark-mode-correcting.
- Already fixed under #52: finding **2** (row keyboard a11y).
- Follow-up ticket: finding **3** (UoM conversions skeleton) — low priority.
