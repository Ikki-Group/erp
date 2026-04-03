---
description: scaffold a new Ikki ERP backend module following Golden Path 2.1
---

# Scaffold Backend Module Workflow

This workflow ensures that any new module generated in the `apps/server/src/modules/` directory strictly adheres to the Golden Path 2.1 architecture.

> **AI Agent Context**: Run these steps sequentially. Do not deviate from the templates.

## Step 1: Pre-flight Checks
1. Ask the User for the exact name of the new `[Domain]` (e.g., `inventory`, `asset`).
2. Ask the User if this module requires a database schema. If yes, generate the schema in `apps/server/src/db/schema/[domain].ts` before proceeding. Ensure the schema uses `serial('id')` for the PK, `snake_case` column names, and `...metadata` for audit trails.

## Step 2: Scaffold Directories
// turbo-all
Create the specific folder structure required for the module.

```bash
DOMAIN_NAME="<module-name>"
mkdir -p apps/server/src/modules/${DOMAIN_NAME}/dto
mkdir -p apps/server/src/modules/${DOMAIN_NAME}/router
mkdir -p apps/server/src/modules/${DOMAIN_NAME}/service
```

## Step 3: Implement DTOs (`dto/`)
Generate the DTOs inside `dto/${DOMAIN_NAME}.dto.ts` according to the Golden Path 2.1 standards.
**Rules**:
- Must include the `Dto` suffix.
- Must use the precise Spread Pattern (`...BaseDto.shape`).
- Must define: `BaseDto`, `[Domain]Dto`, `FilterDto`, `CreateDto`, `UpdateDto`.
- Create the barrel export file `dto/index.ts`.

## Step 4: Implement Service (`service/`)
Copy the structure from `docs/templates/module.service.template.ts`.
Generate the service inside `service/${DOMAIN_NAME}.service.ts`.
**Rules**:
- Must implement `handleList`, `handleDetail`, `handleCreate`, `handleUpdate`, `handleRemove`.
- Must properly implement `@elysiajs/opentelemetry` via the `record()` wrapper.
- Create the ServiceModule injection class and export it.
- Create the barrel export file `service/index.ts`.

## Step 5: Implement Router (`router/`)
Copy the structure from `docs/templates/module.route.template.ts`.
Generate the router inside `router/${DOMAIN_NAME}.route.ts`.
**Rules**:
- Must use the Functional Route Pattern.
- Must destructure `{ body, query, auth }` in the parameters.
- Must use `res.ok`, `res.paginated`, `res.created`.
- Use `PATCH` for updates, not `PUT`.
- Create the barrel export file `router/index.ts`.

## Step 6: Create the Master Barrel Export (`index.ts`)
Create `apps/server/src/modules/${DOMAIN_NAME}/index.ts`.
Export the Router (`init[Domain]Route`) and the Service Module.

## Step 7: Wire into the Registry
1. Open `apps/server/src/modules/_registry.ts`.
2. Locate the correct Layer (0 for Core, 1 for Masters, 2 for Operations).
3. Instantiate the new `ServiceModule` passing down specific dependencies.
4. Mount the router into the main Elysia application graph.
