---
description: How to add a new Drizzle schema table and generate migrations
---

# Add Database Schema

// turbo-all

Follow these steps to add a new table/schema to the database.

## 1. Create or Update Schema File

Schema files live in `server/src/db/schema/`. One file per domain:

- `iam.ts`, `location.ts`, `material.ts`, `product.ts`, `inventory.ts`, `recipe.ts`

If adding to a new domain, create a new file. If extending an existing domain, edit the corresponding file.

### Schema File Template

```typescript
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

// Import shared helpers if using enums
// import { materialTypeEnum } from './_helpers'

export const myTable = pgTable("my_table", {
  id: serial("id").primaryKey(),

  // Domain columns
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),

  // Foreign keys
  parentId: integer("parent_id").references(() => parentTable.id),

  // Numeric values (use numeric for precision)
  price: numeric("price", { precision: 18, scale: 4 }).notNull().default("0"),

  // Audit metadata (ALWAYS include)
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  syncAt: timestamp("sync_at", { withTimezone: true }),
})
```

### Enums

If you need a new enum, add it to `server/src/db/schema/_helpers.ts`:

```typescript
export const myStatusEnum = pgEnum("my_status", ["active", "inactive", "draft"])
```

## 2. Register in Schema Index

Edit `server/src/db/schema/index.ts`:

1. **Import** the table at the top:

   ```typescript
   import { myTable } from "./my-domain"
   ```

2. **Re-export** in the re-export section:

   ```typescript
   export { myTable } from "./my-domain"
   ```

3. **Add to `defineRelations()`** if the table has relationships:
   ```typescript
   export const relations = defineRelations(
     {
       // ... existing tables
       myTable, // ← add here
     },
     (r) => ({
       // ... existing relations
       myTable: {
         parent: r.one.parentTable({
           from: r.myTable.parentId,
           to: r.parentTable.id,
         }),
         children: r.many.childTable(),
       },
     }),
   )
   ```

## 3. Generate Migration

```bash
cd server && bun run db:generate
```

This runs `drizzle-kit generate` and creates a new SQL migration file in `server/src/db/migrations/`.

## 4. Apply Migration

```bash
cd server && bun run db:migrate
```

## 5. Verify

```bash
cd server && bun run db:studio
```

Open Drizzle Studio to verify the table was created correctly.
