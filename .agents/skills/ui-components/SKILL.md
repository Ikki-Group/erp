---
name: ui-components
description: Discover and use the project's UI component library with consistent design patterns. Use when building UI features, creating forms/tables, implementing CRUD operations, or ensuring design consistency across the application.
---

# UI Components & Design System

This skill helps you discover and correctly use the project's component library to build consistent UI/UX. Follow these patterns to maintain design quality and reduce implementation time.

## Quick Discovery

**Live Examples:** http://localhost:4002/design-system
**Full Documentation:** `apps/web/COMPONENT_GUIDE.md`
**Component Source:** `apps/web/src/components/`

Key locations:
- Base UI primitives: `apps/web/src/components/ui/`
- Composed components: `apps/web/src/components/shared/`
- Data tables: `apps/web/src/components/data-table/`
- Charts: `apps/web/src/components/charts/`
- Filter builders: `apps/web/src/components/reui/`

## Component Catalog

### Data Tables

| Component | Location | Use Case |
|-----------|----------|----------|
| `DataTable` | `data-table/data-table.tsx` | Complete table with sorting, filtering, pagination |
| `TextCell` | `data-table/cell.tsx` | Text with truncation + tooltip on overflow |
| `NumericCell` | `data-table/cell.tsx` | Right-aligned numbers with `font-mono tabular-nums` |
| `CurrencyCell` | `data-table/cell.tsx` | Formatted currency, right-aligned |
| `DateCell` | `data-table/cell.tsx` | Localized date display |
| `BadgeCell` | `data-table/cell.tsx` | Status badges with semantic colors |

**Pattern:**
```tsx
import { DataTable } from '@/components/data-table'
import { TextCell, NumericCell } from '@/components/data-table/cell'

const columns = [
  {
    accessorKey: 'name',
    header: 'Material',
    cell: ({ getValue }) => <TextCell value={getValue()} />,
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    cell: ({ getValue }) => <NumericCell value={getValue()} />,
  },
]

<DataTable columns={columns} data={materials} />
```

### Forms

| Component | Location | Use Case |
|-----------|----------|----------|
| `AppField` | `components/shared/form-engine.tsx` | Field wrapper with label, error, description |
| `NumberInputGroup` | `components/ui/number-input-group.tsx` | Numeric input with UOM dropdown |
| `NumberInputGroupAddon` | `components/ui/number-input-group.tsx` | Numeric input with static UOM label |
| `FormTimingContext` | `components/shared/form-engine.tsx` | Track pristine/dirty state |

**Pattern:**
```tsx
import { AppField } from '@/components/shared/form-engine'
import { NumberInputGroup } from '@/components/ui/number-input-group'

<form.AppField name="quantity">
  {(field) => (
    <NumberInputGroup
      field={field}
      uomField={form.Field.name('uom')}
      uomOptions={uomOptions}
    />
  )}
</form.AppField>
```

### Overlays

| Component | Location | Use Case |
|-----------|----------|----------|
| `Dialog` | `components/ui/dialog.tsx` | Modal dialogs (use `react-call` for imperative) |
| `Confirm` | `components/shared/confirm.tsx` | Confirmation dialog with async support |
| `Sheet` | `components/ui/sheet.tsx` | Side panel overlays |
| `Toast` | `components/ui/sonner.tsx` | Flash messages (via `toast()`) |

**Pattern:**
```tsx
import { confirm } from '@/components/shared/confirm'
import { toast } from 'sonner'

// Imperative confirm
const accepted = await confirm({
  title: 'Delete material?',
  description: 'This cannot be undone.',
  variant: 'destructive',
  onConfirm: async () => {
    await api.deleteMaterial(id)
  },
})

// Toast notification
toast.success('Material created')
toast.error('Failed to save')
```

### Charts

| Component | Location | Use Case |
|-----------|----------|----------|
| `LineChart` | `components/charts/line-chart.tsx` | Time series, trends |
| `BarChart` | `components/charts/bar-chart.tsx` | Comparisons, distribution |
| `DonutChart` | `components/charts/donut-chart.tsx` | Proportions, percentages |

## Critical Design Rules

### 1. NUMBERS ARE RIGHT-ALIGNED (Non-Negotiable)

This is critical for ERP/financial applications. Numbers MUST be right-aligned in:
- Table columns (use `NumericCell`, `CurrencyCell`)
- Form inputs (use `NumberInputGroup`)
- Summary totals
- Financial data

```tsx
// ✅ Correct
<NumericCell value={1234.56} />

// ❌ Wrong - never left-align numbers
<div className="text-left">{value}</div>
```

**Why:** Industry standard for ERP systems, aligns decimal points for easy comparison, follows financial reporting conventions.

### 2. Use Cell Components in Tables

Never render table cells manually. Always use cell components:

```tsx
// ✅ Correct
cell: ({ getValue }) => <TextCell value={getValue()} />

// ❌ Wrong
cell: ({ getValue }) => <div>{getValue()}</div>
```

### 3. Monospace Fonts for Numbers

```tsx
// ✅ Correct
<span className="font-mono tabular-nums">{value}</span>

// ❌ Wrong
<span>{value}</span>
```

### 4. Semantic Colors Only

Use Tailwind semantic colors, not raw hex values:

```tsx
// ✅ Correct
<span className="text-muted-foreground">Secondary text</span>
<div className="bg-destructive">Error</div>

// ❌ Wrong
<span style={{ color: '#8a8f98' }}>Text</span>
```

### 5. Spacing Scale

Use consistent spacing based on 4px unit:
- **4px** — Tight internal spacing
- **8px** — Element gaps
- **16px** — Section gaps
- **24px** — Card padding
- **96px** — Page sections

```tsx
// ✅ Correct
<div className="space-y-8">  // Element gap
  <div className="p-24">     // Card padding
    <div className="gap-4">  // Tight spacing
```

## Common Patterns

### Entity List Page

Pattern for displaying a list of entities with search, filters, and actions:

```tsx
// File: routes/materials/index.tsx

export default function MaterialsPage() {
  const { data, isLoading } = useMaterials()
  
  return (
    <div className="space-y-96">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Materials</h1>
          <p className="text-muted-foreground">Manage your inventory</p>
        </div>
        <Button onClick={() => navigate('/materials/new')}>
          Add Material
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchPlaceholder="Search materials..."
      />
    </div>
  )
}
```

### CRUD Form Pattern

Pattern for create/edit forms with validation and loading states:

```tsx
// File: routes/materials/$id/edit.tsx

export default function EditMaterialPage() {
  const { materialId } = useParams()
  const { data, isLoading } = useMaterial(materialId)
  const [saving, setSaving] = useState(false)

  const form = useForm({
    defaultValues: data,
    onSubmit: async ({ value }) => {
      setSaving(true)
      try {
        await api.updateMaterial(materialId, value)
        toast.success('Material updated')
        navigate('/materials')
      } catch (error) {
        toast.error('Failed to update')
      } finally {
        setSaving(false)
      }
    },
  })

  if (isLoading) return <Skeleton />

  return (
    <form onSubmit={form.handleSubmit}>
      <div className="space-y-16">
        <form.AppField name="name">
          {(field) => <Input field={field} />}
        </form.AppField>

        <form.AppField name="quantity">
          {(field) => (
            <NumberInputGroup
              field={field}
              uomField={form.Field.name('uom')}
              uomOptions={UOM_OPTIONS}
            />
          )}
        </form.AppField>

        <div className="flex justify-end gap-8">
          <Button variant="outline" onClick={() => navigate('/materials')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Spinner />}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}
```

### Table with Toolbar

Pattern for table with filters, search, and bulk actions:

```tsx
<div className="space-y-8">
  {/* Toolbar */}
  <div className="flex items-center justify-between">
    <Input placeholder="Search..." className="max-w-sm" />
    <div className="flex items-center gap-8">
      <Select>
        <SelectTrigger>Filter by status</SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline">Export</Button>
    </div>
  </div>

  {/* Table */}
  <DataTable columns={columns} data={data} />
</div>
```

## Anti-Patterns (What NOT to Do)

### ❌ Mixed Alignment in Tables
```tsx
// Wrong - left-aligned numbers
<TableCell className="text-left">{value}</TableCell>
```

### ❌ Bold Weights (700+)
```tsx
// Wrong - too heavy
<span className="font-bold">Text</span>

// Correct - use semibold at most
<span className="font-semibold">Text</span>
```

### ❌ Large Border Radii on Cards
```tsx
// Wrong
<Card className="rounded-2xl"> {/* 16px+, too large */}

// Correct
<Card className="rounded-xl"> {/* 12px max */}
```

### ❌ Decorative Gradients
```tsx
// Wrong - Linear's style is minimal
<Button className="bg-gradient-to-r from-purple-500 to-pink-500">

// Correct - solid colors or semantic
<Button className="bg-primary">
```

### ❌ Manual Cell Rendering
```tsx
// Wrong
<TableCell>{row.getValue('name')}</TableCell>

// Correct
<TableCell>
  <TextCell value={row.getValue('name')} />
</TableCell>
```

### ❌ Raw Color Values
```tsx
// Wrong
<div style={{ color: '#8a8f98' }}>

// Correct
<div className="text-muted-foreground">
```

## Integration with Other Skills

### Use with `impeccable`
When you need design decisions or UI/UX improvements:
```
User: "Make this form more polished"
→ Load impeccable skill for design refinement
→ Apply patterns from this ui-components skill
```

### Use with `shadcn-components`
When working with shadcn/ui primitives:
```
User: "Create a custom button variant"
→ Check shadcn-components for composition patterns
→ Apply design rules from this skill
```

### Use with `codebase-memory`
When searching for specific components:
```
User: "Where is the date cell component?"
→ Use codebase-memory to find DateCell in cell.tsx
→ Check this skill for usage pattern
```

## Quick Reference Cheatsheet

```tsx
// Numbers (RIGHT-ALIGNED)
<NumericCell value={1234} />
<CurrencyCell value={1234.56} currency="USD" />
<NumberInputGroup field={field} uomField={uomField} />

// Text (truncate + tooltip)
<TextCell value={longText} />

// Forms
<form.AppField name="field">{(field) => <Input field={field} />}</form.AppField>

// Dialogs
const result = await confirm({ title: 'Delete?', variant: 'destructive' })

// Toasts
toast.success('Saved')
toast.error('Failed')

// Spacing
<div className="space-y-96">  // Page sections
<div className="space-y-16">  // Form groups
<div className="gap-8">       // Elements
<div className="gap-4">       // Tight

// Colors (semantic)
text-muted-foreground  // Secondary text
text-foreground         // Primary text
bg-destructive         // Error
bg-primary             // Action

// Typography
font-mono tabular-nums // Numbers
font-semibold          // Headings (max)
text-sm                // Body small
text-base              // Body
text-2xl               // Page titles
```

## Component Examples Repository

The `apps/web/src/routes/design-system/` directory contains runnable examples for every component:

- `/design-system/forms` — Input patterns, validation, number inputs
- `/design-system/tables` — Data tables, cell renderers, pagination
- `/design-system/buttons` — Button variants, loading states
- `/design-system/cards` — Card layouts, responsive patterns
- `/design-system/overlays` — Dialogs, sheets, confirmations
- `/design-system/navigation` — Nav bars, breadcrumbs
- `/design-system/feedback` — Loading states, toasts, errors

**Usage:** When implementing a component, first check the design-system route to see the canonical example.

## When to Apply This Skill

Apply this skill when:
- Building new UI features or pages
- Creating forms or tables
- Implementing CRUD operations
- Adding data visualizations
- Fixing UI inconsistencies
- Reviewing code for design compliance
- Answering questions about components

**Trigger phrases:**
- "What component should I use for..."
- "How do I display numbers in tables"
- "Build a form for..."
- "Create a table with..."
- "Show me the pattern for..."
- "Where is the... component"
- "How should I align..."
- "Create a CRUD page for..."
- "Implement a table with..."
- "Add a numeric input with UOM"

## See Also

- **Full Documentation:** `apps/web/COMPONENT_GUIDE.md` (comprehensive guide)
- **Design System Routes:** http://localhost:4002/design-system/* (live examples)
- **Design Tokens:** `apps/web/src/styles.css` (CSS variables)
- **Impeccable Skill:** For design decisions and refinements
- **Shadcn Skill:** For shadcn/ui composition patterns
