# Ikki Web Frontend - UI/UX Component Guide

> **Purpose:** Ensure all agents building UI features follow consistent patterns and use the right components from the design system.

## Quick Navigation

- **Design System Browser:** `http://localhost:3000/design-system`
- **Component Location:** `apps/web/src/components/`
- **Reusable Patterns:** `apps/web/src/components/shared/`

---

## Design Philosophy

### Visual Identity
- **Style:** Linear-inspired precision instrument (dark mode native)
- **Tone:** Minimal, professional, ERP-appropriate
- **Principle:** Content-first, chrome-last

### Key Design Rules

#### 1. **Typography**
- **Font:** Inter Variable (UI), Berkeley Mono (code/IDs)
- **Size:** 13-16px for body text
- **Weights:** 400-510 (avoid bold/700+)
- **Tracking:** Tight (-0.01em to -0.02em) for headings

#### 2. **Color System**
- **Background layers:** Void (#08090a) → Carbon (#0f1011) → Obsidian (#161718) → Graphite (#23252a)
- **Text hierarchy:** Paper (#fff) → Mist (#d0d6e0) → Fog (#8a8f98) → Ash (#62666d)
- **Accent:** Acid Lime (#e4f222) for primary CTAs (use sparingly)
- **Semantic:** Use Tailwind semantic tokens (`text-muted-foreground`, `bg-destructive`, etc.)

#### 3. **Spacing**
- **Base unit:** 4px
- **Common gaps:** 8px (element), 16px (section), 24px (card), 96px (page section)
- **Padding:** 24px for cards, 8-12px for buttons, 2.5px horizontal for inputs

#### 4. **Border Radius**
- **Cards:** 12px
- **Buttons/Inputs:** 6px
- **Badges:** 4px
- **Pills:** 9999px

---

## Component Catalog

### 📊 Data Display (Tables)

**Location:** `apps/web/src/components/data-table/`

#### Core Table Components
- **`DataTable`** — Full-featured table with pagination, sorting, filtering
- **`useClientTable`** / **`useServerTable`** — Table state hooks
- **`TableToolbar`** — Search + filters + actions bar

#### Cell Renderers (Use These!)
```tsx
import { TextCell, NumericCell, CurrencyCell, DateCell } from '@/components/data-table'

// ✅ RIGHT: Use cell components
<TextCell value={material.name} truncate />
<NumericCell value={stock} unit="kg" />
<CurrencyCell value={price} />
<DateCell value={createdAt} withTime />

// ❌ WRONG: Render raw values
<td>{material.name}</td>
<td className="text-right">{stock}</td>
```

**Cell Alignment Rules:**
- **Text:** Left-aligned (default)
- **Numbers:** Right-aligned (`NumericCell`, `CurrencyCell`)
- **Currency:** Right-aligned with locale formatting
- **Dates:** Left-aligned (human-readable)

**Text Truncation:**
```tsx
// ✅ Automatic tooltip on overflow
<TextCell value={longText} truncate className="max-w-40" />

// Tooltip appears on hover + keyboard focus
// Only when text actually overflows
```

---

### 📝 Forms & Inputs

**Location:** `apps/web/src/components/ui/` + `apps/web/src/lib/form/`

#### Form Setup (TanStack Form)
```tsx
import { useAppForm, useEntityForm } from '@/lib/form'

// ✅ Standard form pattern
const form = useAppForm({
  defaultValues: {
    name: '',
    quantity: null as number | null,
    uomId: null as number | null,
  },
})

<form.AppForm>
  <form.AppField name="name">
    {(field) => <field.TextField label="Name" />}
  </form.AppField>
</form.AppForm>
```

#### Field Components
Available on `field.*`:
- `TextField` — Basic text input
- `NumberField` — Numeric input (right-aligned)
- `TextareaField` — Multi-line text
- `SelectField` — Dropdown select
- `ComboboxField` — Searchable select
- `DatePickerField` — Date picker
- `SwitchField` — Boolean toggle
- `CheckboxField` — Checkbox group

#### Number Input Group (NEW)
```tsx
import { NumberInputGroupAddonField, NumberInputGroupField } from '@/lib/form/fields/number-input-group-field'

// ✅ Static UOM (fixed unit)
<form.AppField name="quantity">
  {() => (
    <NumberInputGroupAddonField
      label="Weight"
      uomLabel="kg"
      description="Enter weight in kilograms."
    />
  )}
</form.AppField>

// ✅ Editable UOM (dropdown)
<form.AppField name="quantity">
  {() => (
    <form.AppField name="uomId">
      {() => (
        <NumberInputGroupField
          label="Quantity"
          uomOptions={[
            { id: 1, code: 'kg' },
            { id: 2, code: 'L' },
          ]}
          quantityField={quantityField}
          uomField={uomField}
        />
      )}
    </form.AppField>
  )}
</form.AppField>
```

**Number Input Rules:**
- **Right-aligned** (matches table cells)
- **Monospace font** (`font-mono tabular-nums`)
- **Null handling** (empty = null, not 0)

---

### 🎨 Layout Components

**Location:** `apps/web/src/components/shared/`

#### Page Structure
```tsx
import { PageHeader, PageSection } from '@/components/shared'

<PageShell>
  <PageHeader
    title="Materials"
    description="Manage inventory materials"
    actions={<Button>Add Material</Button>}
  />
  
  <PageSection title="Section Title">
    {/* Content */}
  </PageSection>
</PageShell>
```

#### Cards
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

### 🔘 Buttons

**Location:** `apps/web/src/components/ui/button.tsx`

#### Button Variants
```tsx
import { Button } from '@/components/ui/button'

// Primary actions (acid-lime accent)
<Button>Save Changes</Button>

// Secondary actions
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Edit</Button>

// Destructive actions
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

**Button Rules:**
- **One primary per view** (acid-lime filled)
- **Secondary actions** use outline/ghost
- **Destructive actions** use `variant="destructive"`
- **Minimum size:** 44×44px touch target (auto-applied)

---

### 🏷️ Badges & Status

**Location:** `apps/web/src/components/ui/badge.tsx`

```tsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Low Stock</Badge>
<Badge variant="destructive">Out of Stock</Badge>
<Badge variant="outline">Secondary</Badge>
```

---

### 🔔 Feedback

**Location:** `apps/web/src/components/shared/` + `apps/web/src/components/ui/`

#### Loading States
```tsx
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'

// Inline loading
<Button disabled><Spinner className="mr-2 size-4" /> Loading...</Button>

// Skeleton loading
<Skeleton className="h-4 w-32" />
```

#### Toast Notifications
```tsx
import { toast } from 'sonner'

toast.success('Material created successfully')
toast.error('Failed to save changes')
toast.info('Processing...')
```

#### Confirm Dialogs
```tsx
import { confirm } from '@/components/shared/confirm'

const accepted = await confirm({
  title: 'Delete material?',
  description: 'This action cannot be undone.',
  confirmLabel: 'Delete',
  variant: 'destructive',
  onConfirm: async () => {
    await api.deleteMaterial(id)
  },
})
```

---

### 📋 Overlays

**Location:** `apps/web/src/routes/design-system/overlays.tsx`

#### Dialog/Modal
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### Sheet (Side Panel)
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

---

## Critical Patterns

### 1. **Right-Align All Numbers**
Numbers are ALWAYS right-aligned, whether in tables OR forms.

```tsx
// ✅ RIGHT
<NumericCell value={1234.56} unit="kg" />
<CurrencyCell value={82500} />
<NumberInputGroupAddonField uomLabel="kg" />  {/* Right-aligned internally */}

// ❌ WRONG
<td>{quantity}</td>  {/* Left-aligned by default */}
<Input type="number" />  {/* Left-aligned by default */}
```

### 2. **Use Cell Components in Tables**
Never render table cells manually. Always use cell components.

```tsx
// ✅ RIGHT
col.accessor('price', {
  header: rightAlignedHeader('Price'),
  cell: ({ getValue }) => <CurrencyCell value={getValue()} />,
})

// ❌ WRONG
col.accessor('price', {
  header: 'Price',
  cell: ({ getValue }) => <span>{getValue()}</span>,
})
```

### 3. **Form Field Pattern**
Every form field MUST have a label. Description and error are optional.

```tsx
// ✅ RIGHT
<form.AppField name="quantity">
  {(field) => (
    <field.NumberField
      label="Quantity"
      description="Enter the quantity in stock."
      min={0}
    />
  )}
</form.AppField>

// ❌ WRONG (placeholder-only labels)
<Input placeholder="Quantity" />  {/* No visible label */}
```

### 4. **Semantic Colors**
Use semantic color tokens, not raw hex values.

```tsx
// ✅ RIGHT
<span className="text-muted-foreground">Muted text</span>
<span className="text-destructive">Error</span>
<Button variant="destructive">Delete</Button>

// ❌ WRONG
<span className="text-gray-500">Muted text</span>
<span style={{ color: '#eb5757' }}>Error</span>
```

### 5. **Consistent Spacing**
Use spacing scale (4px base), not arbitrary values.

```tsx
// ✅ RIGHT
<div className="space-y-4">  {/* 16px */}
<div className="gap-2">       {/* 8px */}

// ❌ WRONG
<div style={{ marginTop: '13px' }}>
<div className="mt-[15px]">
```

---

## Common Patterns

### Entity List Page
```tsx
import { EntityListPage } from '@/components/shared'
import { DataTable, useServerTable } from '@/components/data-table'

function MaterialsPage() {
  const { table, recordCount } = useServerTable({
    queryOptions: materialResource.list.queryOptions(),
    columns: baseColumns,
  })

  return (
    <EntityListPage
      title="Materials"
      table={table}
      recordCount={recordCount}
      isLoading={isLoading}
      isError={isError}
      isEmpty={recordCount === 0}
      toolbar={<TableToolbar ... />}
    />
  )
}
```

### CRUD Form Page
```tsx
import { CrudForm } from '@/components/shared'

function MaterialFormPage() {
  const form = useEntityForm({
    defaultValues: { name: '', code: '' },
    onSubmit: async (values) => {
      await api.createMaterial(values)
    },
  })

  return (
    <CrudForm
      title="Add Material"
      form={form}
      onCancel={() => router.push('/materials')}
    >
      <form.AppField name="name">
        {(field) => <field.TextField label="Name" />}
      </form.AppField>
    </CrudForm>
  )
}
```

---

## Anti-Patterns (Avoid)

### ❌ Mixed Alignment
```tsx
// Don't mix alignment in numeric columns
<td className="text-right">{price}</td>  // Right
<td>{quantity}</td>  // Left (inconsistent!)
```

### ❌ Bold Weights
```tsx
// Don't use bold weights
<span className="font-bold">Title</span>  // ❌
<span className="font-medium">Title</span>  // ✅
```

### ❌ Large Radii on Cards
```tsx
// Don't use large radii
<Card className="rounded-2xl">  // ❌ (16px)
<Card className="rounded-xl">   // ✅ (12px)
```

### ❌ Decorative Gradients
```tsx
// Don't add decorative gradients
<Button className="bg-gradient-to-r ...">  // ❌
<Button>Save</Button>  // ✅ (flat color)
```

---

## Testing Your UI

Before submitting UI changes:

1. **Visual Check:** Open `http://localhost:3000/design-system`
2. **Alignment:** Verify numbers are right-aligned
3. **Responsive:** Test on mobile (375px) and desktop (1440px)
4. **Dark Mode:** Check contrast and visibility
5. **Accessibility:** Verify keyboard navigation and focus states

---

## When in Doubt

1. **Check existing usage:** Search the codebase for similar patterns
2. **Visit design-system:** Browse `http://localhost:3000/design-system/*`
3. **Follow the principle:** "Content-first, chrome-last"
4. **Ask:** Is this consistent with the rest of the app?

---

## Reference Files

- **Design Tokens:** `apps/web/src/styles.css` (CSS variables)
- **Tailwind Config:** `apps/web/tailwind.config.ts`
- **Component Library:** Shadcn UI + Base UI + Radix
- **Icons:** Lucide React
- **Forms:** TanStack Form + Zod validation

---

**Last Updated:** 2026-10-04  
**Maintained by:** Ikki Development Team
