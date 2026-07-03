# Schema Conventions

Rules for writing and reviewing `apps/server/src/db/schema/*.ts`. These are
not suggestions — code review should reject schema changes that violate
them without a documented reason (see the one existing exception in `uom.ts`
for what "documented" looks like).

## Table of contents

1. [File organization](#file-organization)
2. [Naming](#naming)
3. [Primary keys](#primary-keys)
4. [Audit columns & soft delete](#audit-columns--soft-delete)
5. [Constraints — query builder only, never raw `sql`](#constraints--query-builder-only-never-raw-sql)
6. [Indexing rules](#indexing-rules)
7. [Enums](#enums)
8. [Numeric precision & scale](#numeric-precision--scale)
9. [Cache-friendliness](#cache-friendliness)
10. [Layering / import direction](#layering--import-direction)
11. [Relations — don't use `db.query...with()`](#relations--dont-use-dbquerywith)
12. [Migration workflow](#migration-workflow)

---

## File organization

**One flat file per domain.** No subfolders under `db/schema/`. The file name
matches the owning module in `apps/server/src/modules/{name}/`, even when
that module has submodules internally:

```
db/schema/iam.ts   → modules/iam/{role,user,assignment}/   (3 submodules, 1 schema file)
db/schema/hr.ts    → modules/hr/{employee,hr,payroll,leave-request}/
db/schema/crm.ts   → modules/crm/                            (module named "crm", not "customer")
```

Within a file, order tables by dependency — the table other tables in the
same file reference comes first (e.g. in `iam.ts`: `roles`, then `users`,
then `user_assignments`, which needs both).

Every table is exported through the single barrel `db/schema/index.ts`.
Never import a table from a specific schema file elsewhere in the codebase —
always `import { xTable } from '@/db/schema'`. This is what makes it safe to
reorganize files without touching `modules/`.

**Why flat, not nested folders:** it was tried (subfolder-per-submodule, e.g.
`payment/method.ts`, `payment/provider.ts`, ...) and reverted — it roughly
doubled the file count for no benefit `modules/` doesn't already provide at
the code-organization level, and made cross-domain imports noisier
(`../../material/core` vs `./material`). Keep it flat.

## Naming

| What                  | Convention                                                                                        | Example                       |
| --------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------- |
| Table variable (TS)   | `{name}Table`, camelCase, singular-ish per Drizzle convention                                     | `purchaseOrdersTable`         |
| Table name (SQL)      | snake_case, plural                                                                                | `purchase_orders`             |
| Column variable (TS)  | camelCase                                                                                         | `locationId`                  |
| Column name (SQL)     | snake_case                                                                                        | `location_id`                 |
| Enum variable (TS)    | `{name}Enum`                                                                                      | `paymentMethodEnum`           |
| Enum name (SQL)       | snake_case                                                                                        | `payment_method`              |
| Index name            | `{table}_{columns}_idx`                                                                           | `sales_orders_location_idx`   |
| Unique index name     | `{table}_{columns}_idx` (no separate suffix — `uniqueIndex()` vs `index()` already disambiguates) | `users_email_idx`             |
| Check constraint name | `{table}_{column-or-rule}_chk`                                                                    | `expenditures_amount_pos_chk` |
| FK column             | `{referencedSingular}Id`                                                                          | `materialId`, `locationId`    |

Rename nothing casually — `code` columns in particular (`locations.code`,
`materials.sku`, `uoms.code`, ...) are treated as stable external identifiers
referenced by seeding, imports, and integrations. Table/column **renames**
are a breaking schema change; adding new columns/tables is not.

## Primary keys

`serial` integer everywhere, via the shared `pk` helper:

```ts
import { pk } from './_helpers'

export const fooTable = pgTable('foo', {
	...pk, // { id: serial('id').primaryKey() }
	// ...
})
```

`pkUUID` exists in `_helpers.ts` but is reserved for tables with extremely
high write-volume across distributed writers where a UUID's lack of
central-sequence contention matters. No current table needs it. Don't reach
for UUIDs for "feels more unique" reasons — serial ints are simpler, smaller,
faster to index, and human-readable in logs/URLs.

## Audit columns & soft delete

Two shared bundles from `_helpers.ts`:

```ts
export const auditBasicColumns = { ...timestampColumns, ...actorColumns }
// createdAt, updatedAt, createdBy, updatedBy

export const auditFullColumns = { ...auditBasicColumns, ...softDeleteColumns }
// + deletedAt, deletedBy
```

**Use `auditFullColumns`** for anything an operator might need to "undo" or
that has referential history worth preserving after deletion (most master
data and transactional headers: `employees`, `suppliers`, `accounts`,
`purchase_orders`, `stock_transfers`, recipe/production tables, ...).

**Use `auditBasicColumns`** for append-only or config rows where soft-delete
doesn't make sense (most junction/line-item tables, `users`, `roles`,
`locations`, sales/payment headers, ...) — check existing sibling tables in
the same file before picking; consistency within a domain matters more than
a strict rule here.

**Use neither** for pure event-log or ultra-high-churn rows where a
`createdBy`/`updatedBy` actor doesn't conceptually apply: `sessions.ts`
(system-managed, not user-mutated) and `material_stock_snapshots` (rebuilt by
a background process, not a user action).

Never hand-roll `createdAt`/`updatedAt`/etc. columns — always spread one of
the two bundles.

## Constraints — query builder only, never raw `sql`

Every `check()` constraint must be built from Drizzle's query builder
operators (`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`, `and`, `or`,
`not`, `isNull`, `isNotNull`, ...), referencing typed columns (`t.column`) —
**never** a `sql\`...\`` template string.

```ts
// ❌ Don't
check('customer_loyalty_txn_balance_nonneg_chk', sql`balance_after >= 0`)

// ✅ Do
check('customer_loyalty_txn_balance_nonneg_chk', gte(t.balanceAfter, 0))
```

Why: `sql` templates are unchecked strings — a typo in a column name, or a
column rename, won't be caught until the migration hits Postgres (or worse,
silently does the wrong thing if it still parses). Query-builder expressions
are type-checked against the table's actual columns.

More patterns, all seen in this codebase:

```ts
// Range
check('taxes_rate_range_chk', between(t.rate, 0, 100))

// Column vs column
check('leave_requests_date_range_chk', gte(t.dateEnd, t.dateStart))

// Not-equal
check('stock_transfers_different_locations_chk', ne(t.sourceLocationId, t.destinationLocationId))

// Conditional (nullable column)
check(
	'material_locations_stock_range_chk',
	or(isNull(t.maxStock), and(gte(t.maxStock, t.minStock), gte(t.maxStock, t.reorderPoint)))!,
)

// NOT + OR
check('sales_types_system_global_chk', or(not(t.isSystem), isNull(t.locationId))!)

// XOR (exactly one of N columns is non-null) — build from AND/OR combinations,
// not CASE WHEN arithmetic (see recipes_target_xor_chk in recipe.ts for the
// full 3-way example)
```

`and()`/`or()` are typed as returning `SQL | undefined` (they accept a
variadic list that could theoretically all be `undefined`). When you know at
the call site that the arguments are always defined — which is every case in
a schema file, since you're not conditionally omitting comparisons — add a
non-null assertion: `and(...)!`. This is expected and correct here; it is
not a workaround.

**The one exception**, and how to handle finding another one: `uom.ts`
needed `code = upper(code)`, which requires an actual SQL function call
(`upper()`) with no query-builder equivalent. Rather than carve out a `sql`
exception, that constraint was **removed** and the invariant pushed to the
Zod boundary instead (`.transform(v => v.toUpperCase())` in `uom.contract.ts`).
If you hit a genuine case like this:

1. First check if the invariant can be expressed as boolean logic instead
   (most "needs a function" cases don't — string case normalization does).
2. If it truly needs a SQL function, prefer moving the invariant to the Zod
   contract (app-layer enforcement) over adding a `sql`-based check.
3. Only if neither works, add the `sql` check with a comment explaining
   why no query-builder equivalent exists, so it doesn't quietly multiply.

## Indexing rules

Postgres does **not** automatically index foreign key columns (only the
referenced side, via the PK). Every FK column needs an index unless it's
already covered as the **leading column** of a composite/unique index on the
same table.

```ts
// FK with no other index on materialId → needs its own
materialId: integer('material_id').notNull().references(() => materialsTable.id),
// ...
index('foo_material_idx').on(t.materialId),

// FK that IS the leading column of a composite unique index → already covered,
// no extra index needed
uniqueIndex('product_prices_product_sales_type_idx').on(t.productId, t.salesTypeId),
// (productId lookups use this index; salesTypeId alone would need its own —
//  and does, see product_prices_sales_type_idx)
```

When adding a new FK, check its sibling FKs on the same table for the
existing pattern before deciding — tables in this schema are internally
consistent (e.g. every `*_items` child table indexes its parent-order FK and
its `materialId`/`productId` FK).

Other index rules already established in this schema, follow them:

- **Partial unique indexes** for soft-delete-safe uniqueness:
  `uniqueIndex('x_code_idx').on(t.code).where(isNull(t.deletedAt))` — lets a
  `code` be reused after a row is soft-deleted, but not while active.
- **Composite indexes for hot query paths**, ordered most-selective-or-most-
  commonly-filtered first: `index('stock_txn_material_location_date_idx').on(t.materialId, t.locationId, t.date)`.
- **Exactly-one-default partial unique index**: `uniqueIndex('product_variants_default_idx').on(t.productId).where(eq(t.isDefault, true))`.
- Don't add an index "just in case" — every index has a write-amplification
  cost. Add it when there's a real query pattern (a repo method that filters/
  joins on that column) or it's a genuine FK gap per the rule above.

## Enums

Enum lives **next to its primary table** in the same domain file, unless it
is genuinely shared by two _unrelated_ domains — then it goes in `_enums.ts`.

```ts
// Colocated (normal case) — payment.ts
export const paymentMethodEnum = pgEnum('payment_method', [...])
export const paymentMethodsTable = pgTable('payment_methods', { ... })

// Shared (rare) — _enums.ts
export const invoiceStatusEnum = pgEnum('invoice_status', [...])
// used by both purchasing.ts (purchase_invoices) and sales.ts (sales_invoices)
```

Before adding to `_enums.ts`, ask: does moving this here avoid one domain
importing the other _purely_ to reuse a type? If a real FK/data dependency
already exists between the domains, just colocate the enum with whichever
table is more "the owner" of the concept — don't reflexively centralize.

## Numeric precision & scale

Two scales are used throughout, pick based on what the number represents:

| Kind                            | Precision/scale  | Used for                                          |
| ------------------------------- | ---------------- | ------------------------------------------------- |
| Money / currency amounts        | `numeric(18, 2)` | prices, totals, taxes, discounts, GL debit/credit |
| Quantities / conversion factors | `numeric(18, 6)` | stock qty, recipe qty, UOM conversion factors     |
| Percentages                     | `numeric(5, 2)`  | tax rate, scrap percentage (max 100.00)           |

Quantities use scale 6 (not 2) because UOM conversions can produce small
fractional results (e.g. grams → kg) that scale-2 would truncate. Never mix
scale-2 quantity columns into a table that also has scale-6 quantities
elsewhere in the same domain — check the sibling table in the same file.

## Cache-friendliness

Two structural patterns exist specifically so the cache layer (see
`apps/server/src/infra/cache/`) can apply different TTL tiers without
fighting the schema:

1. **Separate config from projection/read-model tables** when their write
   frequency differs a lot. Example: `material_locations` (config — min/max
   stock thresholds, changes rarely, operator-edited) vs
   `material_stock_snapshots` (projection — current qty/cost, rewritten on
   every stock movement, event-handler-owned). Same composite key
   `(materialId, locationId)`, always read together via a join, but kept in
   separate tables so a long TTL on the config half doesn't force a long TTL
   on the fast-changing half.
2. **Prefer immutable/append-only history tables** over mutating a running
   total in place, when the history itself has value (e.g.
   `customer_loyalty_transactions` recording each point movement +
   `balanceAfter`, rather than only storing the current balance on
   `customers`). This makes cache invalidation trivial for the append side
   (new rows never invalidate old cached reads) even though the aggregate
   (`customers.pointsBalance`) still needs invalidating.

When adding a new high-write-frequency table, ask whether it should be
split into a rarely-changing config half and a frequently-changing state
half before writing it as one table.

## Layering / import direction

Schema files may only import "downward", mirroring the module layer
hierarchy documented in `apps/server/docs/ARCHITECTURE.md`:

```
Integrations   (moka.ts)
     ↓
Operations     (crm, hr, finance, payment, inventory, purchasing, production, recipe, sales)
     ↓
Master data    (location, uom, tax, supplier, company, sales-type, material, product)
     ↓
Core           (audit, session, iam)
```

Same-layer files may import each other (e.g. `sales.ts` imports `crm.ts` —
both Operations). A lower layer must never import from a higher one. See
`erd/00-overview.md` for the actual current dependency graph — check it
before adding a new cross-file import to make sure you're not about to
introduce an upward or circular dependency.

Note this is about **schema file imports** (which table definitions
reference which), not module/service imports — a table having an FK to
`locationsTable` doesn't make the _module_ that owns that table depend on
the location module's service layer; that's a separate, looser rule.

## Relations — don't use `db.query...with()`

`_relations.ts` is an intentionally empty stub. Every relational read in this
codebase is built manually: `.select()` per table + `RelationMap` (see
`apps/server/src/shared/utils/relation-map.ts`) to join in memory. This is
not an oversight — it's what makes per-entity caching possible. A
`db.query.x.findMany({ with: { y: true } })` call always executes a live SQL
join against Postgres; it cannot go through the `CacheService` layer at all.

If you're tempted to add `relations()` definitions to enable this API for a
new feature, don't — extend the RelationMap pattern in the service layer
instead. `relations()` may eventually be worth adding purely for Drizzle
Studio browsing/ad-hoc scripts, but that's a separate, low-priority, opt-in
addition — never a prerequisite for building a feature.

## Migration workflow

```bash
cd apps/server
bun run db:generate   # generates a new migration from schema diff
bun run db:migrate     # applies pending migrations
```

- Never hand-edit a generated migration file after the fact — if it's wrong,
  fix the schema and regenerate.
- Never run `db:migrate` against a shared/production database without the
  person owning that database's explicit go-ahead for that session — schema
  changes in this repo are typically drafted first, reviewed, and migrated
  separately.
- Table/column **renames** require `drizzle-kit`'s interactive rename
  prompt during `db:generate` (it asks "did you rename X to Y?") — always
  answer that prompt correctly; declining it silently becomes a drop + create,
  losing data.
