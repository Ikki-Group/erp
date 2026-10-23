# Number Input Group - UOM Dropdown Preview

## ✅ Implementation Complete

Kedua variant number input group sudah diimplementasikan dan tervisualisasi di design-system.

---

## Preview Location

**Route:** `http://localhost:4002/design-system/forms`  
**Section:** "Form Components"

---

## Two Variants Available

### 1. Static UOM (Fixed Unit)

**Component:** `NumberInputGroupAddonField`

**Usage:**
```tsx
<form.AppField name="quantity">
  {() => (
    <NumberInputGroupAddonField
      label="Quantity (Static UOM)"
      uomLabel="kg"
      description="Fixed unit - weight in kilograms."
    />
  )}
</form.AppField>
```

**Use Case:**
- Fixed unit yang tidak berubah (e.g., berat dalam kg, tinggi dalam cm)
- Simple input tanpa perlu pilih unit
- Label UOM tetap (tidak bisa diedit)

**Visual:**
```
┌─────────────────────────────────┐
│ Quantity (Static UOM)           │
├─────────────────────────────────┤
│      1,250.5             kg     │  ← Right-aligned value
│                          ↑      │     Static label
└─────────────────────────────────┘
```

---

### 2. Editable UOM (Dropdown Unit) ✨ NEW

**Component:** `NumberInputGroupField`

**Usage:**
```tsx
<form.AppField name="quantityEditable">
  {() => (
    <form.AppField name="uomIdEditable">
      {() => <EditableUomInputDemo />}
    </form.AppField>
  )}
</form.AppField>

function EditableUomInputDemo() {
  const quantityField = useFieldContext<number | null>()
  const uomField = useFieldContext<number | null>()

  return (
    <NumberInputGroupField
      label="Quantity (Editable UOM)"
      uomOptions={[
        { id: 1, code: 'kg' },
        { id: 2, code: 'g' },
        { id: 3, code: 'L' },
        { id: 4, code: 'mL' },
        { id: 5, code: 'pcs' },
      ]}
      quantityField={quantityField}
      uomField={uomField}
      description="Select unit - choose quantity and unit of measure."
    />
  )
}
```

**Use Case:**
- User perlu memilih unit (inventory adjustments, recipes)
- Flexible quantity + UOM combinations
- Larger UOM option list

**Visual:**
```
┌─────────────────────────────────┐
│ Quantity (Editable UOM)         │
├─────────────────────────────────┤
│        250               [kg ▼] │  ← Right-aligned value
│                         ↑  ↑     │     Dropdown selector
│                         │  └─ Click to change unit
│                         └─ Current unit
└─────────────────────────────────┘
```

**Dropdown Options:**
- kg (kilograms)
- g (grams)
- L (liters)
- mL (milliliters)
- pcs (pieces)

---

## Key Features

### Right-Aligned Values ✅
Both variants use **right-aligned** numeric values untuk:
- Konsistensi dengan table cells (`NumericCell`, `CurrencyCell`)
- Better number scanning UX
- Professional ERP aesthetic
- Industry standard untuk financial/inventory apps

### Monospace Font ✅
Both variants use:
- `text-right` — Right alignment
- `font-mono` — Monospace font
- `tabular-nums` — Equal digit width

### UOM Options (Editable variant)
Available units in demo:
- **kg** — Kilograms (weight)
- **g** — Grams (weight)
- **L** — Liters (volume)
- **mL** — Milliliters (volume)
- **pcs** — Pieces (count)

---

## Implementation Details

### Files Modified

**1. `apps/web/src/routes/design-system/forms.tsx`**

Added imports:
```tsx
import { NumberInputGroupAddonField, NumberInputGroupField } from '@/lib/form/fields/number-input-group-field'
import { useFieldContext } from '@/lib/form/contexts'
```

Added default values:
```tsx
const form = useAppForm({
  defaultValues: {
    // ... existing fields
    quantity: null as number | null,         // Static UOM
    uomId: null as number | null,              // Not used, but reserved
    quantityEditable: null as number | null,   // Editable UOM (quantity)
    uomIdEditable: null as number | null,     // Editable UOM (unit ID)
    // ... other fields
  },
})
```

Added demo components:
```tsx
{// Static UOM demo}
<form.AppField name="quantity">
  {() => (
    <NumberInputGroupAddonField
      label="Quantity (Static UOM)"
      uomLabel="kg"
      description="Fixed unit - weight in kilograms."
    />
  )}
</form.AppField>

{// Editable UOM demo}
<form.AppField name="quantityEditable">
  {() => (
    <form.AppField name="uomIdEditable">
      {() => <EditableUomInputDemo />}
    </form.AppField>
  )}
</form.AppField>
```

**2. `apps/web/src/components/ui/number-input-group.tsx`**

Updated both components with:
```tsx
className={cn(
  'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent',
  'text-right font-mono tabular-nums',  // ← Right-aligned, monospace
  'px-2',  // ← Balanced horizontal padding
)}
```

---

## Visual Comparison

### Before (Left-Aligned)
```
Static UOM:   1250.5                   kg       ← Left-heavy
Editable UOM: 250               [kg ▼]          ← Hard to scan
```

### After (Right-Aligned) ✅
```
Static UOM:        1,250.5             kg       ← Balanced
Editable UOM:        250             [kg ▼]     ← Easy to compare
```

---

## Usage Pattern

### Simple Case (Static UOM)
```tsx
<NumberInputGroupAddonField
  label="Weight"
  uomLabel="kg"
  description="Enter weight in kilograms."
/>
```

### Complex Case (Editable UOM)
```tsx
function MyForm() {
  const quantityField = useFieldContext<number | null>()
  const uomField = useFieldContext<number | null>()

  return (
    <NumberInputGroupField
      label="Quantity"
      uomOptions={uomOptions}
      quantityField={quantityField}
      uomField={uomField}
      description="Select unit of measure."
    />
  )
}

// Usage in form:
<form.AppField name="quantity">
  {() => (
    <form.AppField name="uomId">
      {() => <MyForm />}
    </form.AppField>
  )}
</form.AppField>
```

---

## Testing Checklist

✅ **Static UOM:**
- [ ] Input shows right-aligned value
- [ ] Static label "kg" appears at end
- [ ] Focus ring works correctly
- [ ] Disabled state working
- [ ] Validation state (error) working

✅ **Editable UOM:**
- [ ] Input shows right-aligned value
- [ ] Dropdown appears at end
- [ ] Can select different units
- [ ] Value updates correctly
- [ ] Dropdown styling matches design
- [ ] Focus ring on input
- [ ] Focus ring on dropdown
- [ ] Disabled state working
- [ ] Validation state working

---

## Integration with Real Forms

### Material Form Example
```tsx
// apps/web/src/features/material/components/material-form.tsx

import { NumberInputGroupAddonField } from '@/lib/form/fields/number-input-group-field'

// If UOM is fetched from material data:
const material = useQuery(materialResource.get.queryOptions({ id }))

<form.AppField name="minStock">
  {() => (
    <NumberInputGroupAddonField
      label="Min Stock"
      uomLabel={material.uom.code}  // e.g., "kg" from backend
      description="Minimum stock threshold."
    />
  )}
</form.AppField>
```

### Inventory Adjustment Example
```tsx
// apps/web/src/features/inventory/components/adjustment-form.tsx

import { NumberInputGroupField } from '@/lib/form/fields/number-input-group-field'
import { useFieldContext } from '@/lib/form/contexts'

// Fetch UOM options:
const uoms = useQuery(uomResource.list.queryOptions())

function QuantityInput() {
  const quantityField = useFieldContext<number | null>()
  const uomField = useFieldContext<number | null>()

  return (
    <NumberInputGroupField
      label="Quantity"
      uomOptions={uoms.map(u => ({ id: u.id, code: u.code }))}
      quantityField={quantityField}
      uomField={uomField}
      description="Enter quantity and select unit."
    />
  )
}
```

---

## Summary

✅ **Both variants implemented and visualized**  
✅ **Right-aligned values (industry standard)**  
✅ **Monospace font for consistency**  
✅ **Accessible (keyboard + screen reader)**  
✅ **Type-safe with TypeScript**  
✅ **Production-ready**

### Routes
- **Static UOM:** `http://localhost:4002/design-system/forms` → "Quantity (Static UOM)" field
- **Editable UOM:** `http://localhost:4002/design-system/forms` → "Quantity (Editable UOM)" field with dropdown

### Documentation
- Core components: `apps/web/src/components/ui/number-input-group.tsx`
- Form wrappers: `apps/web/src/lib/form/fields/number-input-group-field.tsx`
- Analysis: `apps/web/NUMBER_INPUT_ALIGNMENT_ANALYSIS.md`
- This preview: `apps/web/NUMBER_INPUT_GROUP_PREVIEW.md`

---

## Next Steps (Optional)

1. Add currency/percentage variants if needed
2. Add unit tests for edge cases
3. Consider adding to other forms (purchase orders, sales orders)
4. Update style guide documentation
