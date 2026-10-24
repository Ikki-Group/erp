# Number Input Group Implementation Summary

## Overview
Implemented two reusable numeric input components for the Ikki ERP application following the existing Shadcn UI composition patterns and Tailwind CSS design tokens.

## Files Created

### 1. `apps/web/src/components/ui/number-input-group.tsx`
Core component implementations:

#### `NumberInputGroupAddon`
- Numeric input with a **static** UOM label at the end
- Use case: Fixed unit inputs (e.g., weight in kg, quantity in pcs)
- Features:
  - Controlled input (`value`/`onChange`)
  - Disabled state support
  - Validation state (`aria-invalid`)
  - TypeScript type safety
  - Follows existing InputGroup styling patterns

#### `NumberInputGroup`
- Numeric input with an **editable** UOM dropdown at the end
- Use case: Variable unit inputs where user selects both quantity and UOM
- Features:
  - Separate controlled states for value and UOM
  - Full dropdown integration
  - Type-safe UOM option requirements
  - Consistent styling with InputGroup pattern

### 2. `apps/web/src/lib/form/fields/number-input-group-field.tsx`
Form field wrappers for TanStack Form integration:

#### `NumberInputGroupAddonField`
- Single-field binding for simple numeric input with static UOM
- Follows existing field wrapper pattern (`useFieldContext`)
- Automatic label, description, and error display
- Field value type: `number | null`

#### `NumberInputGroupField`
- Dual-field binding for quantity + UOM ID
- **Important usage pattern**: Requires passing two separate field contexts
- See usage example below
- Field value types: `number | null` for both quantity and UOM ID

### 3. `apps/web/src/components/ui/number-input-group.README.md`
Comprehensive usage documentation with examples

### 4. `apps/web/src/lib/form/index.ts`
- Exported new field wrapper types

### 5. `apps/web/src/routes/design-system/forms.tsx`
- Added live demo of `NumberInputGroupAddonField` component

## Usage Examples

### Simple: Static UOM (NumberInputGroupAddonField)
```tsx
import { NumberInputGroupAddonField } from '@/lib/form/fields/number-input-group-field'

function MyForm() {
  const form = useAppForm({
    defaultValues: {
      quantity: null as number | null,
    },
  })

  return (
    <form.AppForm>
      <form.AppField name="quantity">
        {(field) => (
          <NumberInputGroupAddonField
            label="Quantity"
            uomLabel="kg"
            description="Enter weight in kilograms."
          />
        )}
      </form.AppField>
    </form.AppForm>
  )
}
```

### Advanced: Editable UOM (NumberInputGroupField)
```tsx
import { NumberInputGroupField } from '@/lib/form/fields/number-input-group-field'
import { useFieldContext } from '@/lib/form'

function MyForm() {
  const form = useAppForm({
    defaultValues: {
      quantity: null as number | null,
      uomId: null as number | null,
    },
  })

  const uomOptions = [
    { id: 1, code: 'kg' },
    { id: 2, code: 'pcs' },
    { id: 3, code: 'L' },
  ]

  return (
    <form.AppForm>
      {/* Must use TWO separate AppField contexts */}
      <form.AppField name="quantity">
        {(quantityField) => (
          <form.AppField name="uomId">
            {(uomField) => (
              <NumberInputGroupField
                label="Quantity"
                uomOptions={uomOptions}
                quantityField={quantityField}
                uomField={uomField}
              />
            )}
          </form.AppField>
        )}
      </form.AppField>
    </form.AppForm>
  )
}
```

## Design Decisions

1. **Type Safety**: Used `type="number"` directly instead of Base UI NumberField primitive for simplicity and consistency with existing numeric inputs

2. **Null Handling**: Empty inputs are treated as `null` (not `0` or `undefined`) for better form state management

3. **UOM Dropdown**: Uses the existing `Select` component with code-based display (e.g., "kg", "pcs")

4. **Dual Field Context**: `NumberInputGroupField` requires passing two field contexts because TanStack Form's type system doesn't support inline nested field access in component props

5. **Styling**: Follows existing InputGroup patterns with proper focus rings, borders, and responsive behavior

6. **No Spinner Buttons**: Deliberately omitted stepper buttons for a cleaner, more minimal interface

## Verification Completed

✅ TypeScript compilation: No errors  
✅ Oxlint: No errors or warnings  
✅ Oxfmt: All files properly formatted  
✅ Diagnostics: Clean  

## Demo Location

Live demo available at: `http://localhost:4002/design-system/forms`

Scroll to the "Form Components" section to see the `NumberInputGroupAddonField` in action.

## Next Steps (Optional)

1. **Integration Example**: Consider adding `NumberInputGroupField` to material form (`apps/web/src/features/material/components/material-form.tsx`) for quantity + UOM fields

2. **Additional Variants**: Could add currency-specific or percentage-specific variants if needed (not included in this implementation)

3. **Validation**: Add min/max constraints or precision validation as business requirements emerge

4. **Testing**: Add unit tests for edge cases (empty values, NaN handling, UOM selection)

## API Reference

### NumberInputGroupAddon Props
```typescript
interface NumberInputGroupAddonProps {
  uomLabel: string              // Static UOM label (e.g., "kg", "pcs")
  value?: number               // Current numeric value
  onChange?: (value: number | null) => void
  disabled?: boolean
  className?: string
  // ... all other HTML input attributes except 'type'
}
```

### NumberInputGroup Props
```typescript
interface NumberInputGroupProps {
  value: number | null | undefined
  uomId: number | null | undefined
  uomOptions: Array<{ id: number; code: string }>
  onChange?: (value: number | null) => void
  onUomChange?: (uomId: number) => void
  disabled?: boolean
  className?: string
  // ... all other HTML input attributes except 'type', 'onChange', 'value'
}
```

### Form Field Props
```typescript
interface NumberInputGroupAddonFieldProps {
  label: string
  uomLabel: string
  description?: string
  className?: string
  disabled?: boolean
  // ... NumberInputGroupAddon props (except value/onChange)
}

interface NumberInputGroupFieldProps {
  label: string
  uomOptions: Array<{ id: number; code: string }>
  description?: string
  className?: string
  disabled?: boolean
  quantityField: FieldContext<number | null>
  uomField: FieldContext<number | null>
  // ... NumberInputGroup props (except value/uomId/onChange/onUomChange)
}
```

## Implementation Notes

- Components use existing `Input`, `Select`, and `Label` components from `@/components/ui`
- Compatible with TanStack Form's `useAppForm` and `useEntityForm` hooks
- UOM data structure matches `UomDto` from `@/features/uom/dto`
- Styling consistent with existing InputGroup patterns (6px radius, proper focus states, dark mode support)
- Proper accessibility attributes (`aria-invalid`, `aria-describedby` for errors)
