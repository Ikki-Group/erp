# Backend Standard: Database Layer (Drizzle ORM)

This document defines the **Golden Path 2.0** standards for the database layer using **Drizzle ORM** within the Ikki ERP backend.

## 1. Naming Convention (Snake Case vs Camel Case)

The database columns must use `snake_case`, while the property names in the Drizzle schema must use `camelCase`.

```typescript
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(), // ✅ TS Property: camelCase, DB Column: snake_case
  // ...
})
```

## 2. Shared Helpers

Standardize PK and Audit columns using the helpers in `@/db/schema/_helpers`. This provides consistency for storage and tracking.

- **Primary Key**: Use `...pk` for `id: serial('id').primaryKey()`.
- **Audit Columns**: Use `...metadata` for `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt`, `deletedBy`, and `syncAt`.

```typescript
import { pk, metadata } from './_helpers'

export const myTable = pgTable('my_table', {
  ...pk,              // serial primary key 'id'
  code: text('code').notNull(),
  ...metadata,        // all audit columns
})
```

## 3. Storage Efficiency (Integer vs UUID)

- **Default PKs**: Use **Serial Integers** (4 bytes) for most domain records to maximize storage efficiency and join performance.
- **UUIDs**: Reserved for extremely high-growth data or records that must be uniquely identified across systems without a central sequence (e.g., sync-heavy logs).

## 4. Uniqueness & Indexes

Define all uniqueness constraints and indexes within the table definition to ensure database-level integrity.

- Use **Unique Indexes** for logical keys (e.g., `code`, `name`).
- Filter unique indexes with `where(isNull(t.deletedAt))` for soft-deleted tables to allow reuse of keys after archiving.

```typescript
uniqueIndex('roles_code_idx').on(t.code).where(isNull(t.deletedAt)),
```

## 5. Relationships (Foreign Keys)

Define explicit foreign key references in the Drizzle schema to enable cascading behavior and metadata-driven queries.

```typescript
roleId: integer('role_id')
  .notNull()
  .references(() => rolesTable.id, { onDelete: 'restrict' }),
```

## 6. Migration Workflow

Migrations should be generated and applied using the **Drizzle Kit**.
1. Modify the schema in `src/db/schema/`.
2. Run `drizzle-kit generate`.
3. Review the generated SQL in `drizzle/`.
4. Apply migrations using `drizzle-kit push` or `drizzle-kit migrate`.

---

> [!CAUTION]
> Avoid ad-hoc `raw sql` queries unless absolutely necessary for complex performance tuning. Always favor the Drizzle query builder or ORM API to maintain type integrity.
