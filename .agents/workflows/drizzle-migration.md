---
description: safely generate, format, and apply Drizzle database migrations
---

# Generate and Apply Drizzle Migrations

Execute this workflow whenever modifying any table definition in `apps/server/src/db/schema/`.

## Step 1: Pre-generation Safety Checks
1. Have you modified the schema models using `camelCase` for TypeScript variables and `snake_case` for the db columns?
2. Have you correctly used `@/db/schema/_helpers` for `...pk` and `...metadata`?
3. **Important Check**: Read the existing contents of `apps/server/drizzle/meta/_journal.json` to understand the previous migration state. 

## Step 2: Generate Migration
// turbo
Generate the SQL files representing your schema change.

```bash
cd apps/server && bun run db:generate
```

## Step 3: Manual SQL Formatting
Wait for the command to complete.
Use the `view_file` tool to inspect the newly generated `.sql` file in the `apps/server/drizzle/` directory.
> **AI Instruction**: The generated SQL can be formatted poorly. Verify that constraints and indices are correctly mapped to integer columns and that there are no accidental UUID generation functions applied to Serial PKs.

## Step 4: Apply Migration
Once the `.sql` has been manually verified, push the migration to the database using `migrate`.
// turbo

```bash
cd apps/server && bun run db:migrate
```

## Step 5: Verification
1. Export the newly generated tables. 
2. Verify application compilation locally via `cd apps/server && bun run verify`.
