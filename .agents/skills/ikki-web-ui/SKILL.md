---
name: ikki-web-ui
description: Build UI for Ikki ERP web app using registered components, following established patterns and product conventions. Use when creating pages, forms, tables, or any UI in apps/web.
---

# Ikki Web UI Skill

## Overview

This skill guides you to build UI for the Ikki ERP web application (`apps/web`) using the established component registry and project conventions. **Every UI decision must reference the component registry first to prevent duplication.**

**Announce at start:** "I'm using the ikki-web-ui skill to build this interface."

## MANDATORY FIRST STEP: Read the Registry

Before writing ANY UI code, you MUST read the component registry summary:

```
apps/web/src/components/REGISTRY.md
```

This file contains every registered component with its import path, usage guide, and standard page patterns. It is optimized for AI consumption. **Do not skip this step.**

If `REGISTRY.md` does not contain a component you need, check the full typed registries:
- `apps/web/src/components/layout/registry.ts`
- `apps/web/src/components/form/registry.ts`
- `apps/web/src/components/data-table/registry.ts`
- `apps/web/src/components/blocks/registry.ts`
- `apps/web/src/components/providers/registry.ts`

## Component Layer Rules

### Readonly Layers (NEVER modify)
- **`components/ui/`** — Shadcn managed. Add via `npx shadcn@latest add <component>`.
- **`components/reui/`** — Internal base UI. Only modify if explicitly asked.

### Mutable Layers
- **`components/layout/`** — Page structures. Use `Page`, `FormLayout`.
- **`components/form/`** — Form engine. Use `FormInput`, `FormSelect`, etc.
- **`components/data-table/`** — Table engine. Use `useDataTable`, `useDataTableState`.
- **`components/blocks/`** — Shared UI blocks. `StatusBadge`, `EmptyState`, `DataTableCard`, etc.
- **`components/providers/`** — Global providers. `ThemeSwitcher`.

## Golden Rules

### 1. Routes are Composers, Not Builders
Route files (`src/routes/`) must ONLY compose and integrate. **Never define** table columns, form fields, or complex UI inside route files.

✅ **Correct:**
```tsx
// src/routes/_app/product/index.tsx
import { ProductTable } from '@/features/product/components/product-table'

function RouteComponent() {
  return (
    <Page>
      <Page.BlockHeader title="Products" />
      <Page.Content><ProductTable /></Page.Content>
    </Page>
  )
}
```

❌ **Wrong:** Defining `columns`, `useQuery`, `ProductTable` inside the route file.

### 2. Feature Components Live in Features
UI components specific to a business domain belong in:
```
src/features/{domain}/components/{component-name}.tsx
```
They can use `useQuery` internally for self-contained data fetching, or accept data as props when the router pre-loads via loaders.

### 3. Registry Before Creation
Before creating ANY new shared component:
1. Read `REGISTRY.md`
2. Search by tags: does a similar component exist?
3. If YES → use the existing one
4. If NO → create it AND add a registry entry

### 4. When Adding a New Component
You MUST update THREE places:
1. The component file itself
2. The layer's `registry.ts` (add entry with name, description, usage, importPath, exports, tags)
3. `REGISTRY.md` (add a row to the appropriate table)

## Standard Page Patterns

### List Page (Server-Side Table)
```tsx
// Feature component: src/features/{domain}/components/{domain}-table.tsx
import { useQuery } from '@tanstack/react-query'
import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

const columns = [/* column definitions */]

export function DomainTable() {
  const ds = useDataTableState<FilterDto>()
  const { data, isLoading } = useQuery(domainApi.list.query({ ...ds.pagination, search: ds.search }))
  const table = useDataTable({ columns, data: data?.data ?? [], pageCount: data?.meta.totalPages ?? 0, rowCount: data?.meta.total ?? 0, ds })

  return (
    <DataTableCard
      title="..."
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total ?? 0}
      toolbar={<DataGridFilter ds={ds} options={[...]} />}
      action={<Button>Create</Button>}
    />
  )
}
```

### Create/Edit Form Page
```tsx
import { Page } from '@/components/layout/page'
import { FormLayout } from '@/components/layout/form-layout'
import { useAppForm } from '@/components/form'

export function DomainForm() {
  const form = useAppForm({ defaultValues: {...}, onSubmit: async (values) => {...} })

  return (
    <Page size="md">
      <Page.BlockHeader title="Create Domain" back={{ to: '/domain' }} />
      <Page.Content>
        <FormLayout>
          <FormLayout.CardSection title="Basic Info">
            <FormLayout.Grid>
              {/* Use form fields from @/components/form */}
            </FormLayout.Grid>
          </FormLayout.CardSection>
          <FormLayout.Actions>
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Save</Button>
          </FormLayout.Actions>
        </FormLayout>
      </Page.Content>
    </Page>
  )
}
```

### Detail Page
```tsx
import { Page } from '@/components/layout/page'
import { DetailCard } from '@/components/blocks/data-display/detail-card'

export function DomainDetail({ data }) {
  return (
    <Page>
      <Page.BlockHeader title={data.name} back={{ to: '/domain' }} />
      <Page.Content>
        <DetailCard title="Information" items={[
          { label: 'Name', value: data.name },
          { label: 'Status', value: <ActiveStatusBadge status={data.status} /> },
        ]} />
      </Page.Content>
    </Page>
  )
}
```

## Tech Stack Context
- **Framework:** React 19 + Vite 7
- **Routing:** TanStack Router (file-based)
- **State:** Zustand (global), TanStack Query (server)
- **Forms:** TanStack Form + Zod
- **Tables:** TanStack Table
- **Styling:** Tailwind CSS v4 with OKLCH color system
- **Icons:** Lucide React
- **Language:** Indonesian for user-facing labels

## Checklist Before Submitting UI Code

- [ ] Read `REGISTRY.md` before creating any component
- [ ] Route file only composes — no inline component definitions
- [ ] Feature components live in `src/features/{domain}/components/`
- [ ] New shared components have registry entries in both `registry.ts` and `REGISTRY.md`
- [ ] Uses `Page` wrapper with `Page.BlockHeader`
- [ ] Uses `FormLayout` for form pages
- [ ] Uses `DataTableCard` + `useDataTable` for table pages
- [ ] Indonesian labels for UI text
- [ ] No duplicate components created
