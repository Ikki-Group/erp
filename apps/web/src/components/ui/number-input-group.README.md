# Number Input Group Components

Reusable numeric input components with UOM (Unit of Measure) integration.

## Components

### `NumberInputGroupAddon`

Numeric input with a **static** UOM label at the end.

Use when the unit of measure is fixed/known in advance (e.g., weight in kg, quantity in pieces).

### `NumberInputGroup`

Numeric input with an **editable** UOM dropdown at the end.

Use when both the quantity and unit need to be user-selected (e.g., inventory adjustments, recipe ingredients).

## Usage

### Basic (standalone)

```tsx
import { NumberInputGroup, NumberInputGroupAddon } from '@/components/ui/number-input-group'

// Static UOM
<NumberInputGroupAddon
  uomLabel="kg"
  value={weight}
  onChange={(e) => setWeight(parseFloat(e.target.value))}
/>

// Editable UOM
<NumberInputGroup
  value={quantity}
  uomId={uomId}
  uomOptions={[
    { id: 1, code: 'kg' },
    { id: 2, code: 'g' },
    { id: 3, code: 'pcs' },
  ]}
  onChange={setQuantity}
  onUomChange={setUomId}
/>
```

### With TanStack Form

```tsx
import { useAppForm } from '@/lib/form'
import { NumberInputGroupAddonField } from '@/lib/form/fields/number-input-group-field'

const form = useAppForm({
  defaultValues: {
    weight: null as number | null,
  },
})

<form.AppForm>
  <form.AppField name="weight">
    {(field) => (
      <field.NumberInputGroupAddonField
        label="Weight"
        uomLabel="kg"
        placeholder="Enter weight..."
      />
    )}
  </form.AppField>
</form.AppForm>
```

### With Editable UOM in Forms

For `NumberInputGroupField` with editable UOM, you need to handle two fields:

```tsx
import { useAppForm } from '@/lib/form'
import { NumberInputGroupField } from '@/lib/form/fields/number-input-group-field'
import { useFieldContext } from '@/lib/form/contexts'

const form = useAppForm({
  defaultValues: {
    quantity: null as number | null,
    uomId: null as number | null,
  },
})

<form.AppForm>
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
```

## Props

### NumberInputGroupAddonProps

| Prop                     | Type                              | Description                               |
| ------------------------ | --------------------------------- | ----------------------------------------- |
| `uomLabel`               | `string`                          | Static label displayed at the end         |
| `value`                  | `number \| null \| undefined`     | Current numeric value                     |
| `onChange`               | `(value: number \| null) => void` | Called when value changes                 |
| `disabled`               | `boolean`                         | Disabled state                            |
| All standard input props |                                   | `placeholder`, `min`, `max`, `step`, etc. |

### NumberInputGroupProps

| Prop                     | Type                                  | Description                               |
| ------------------------ | ------------------------------------- | ----------------------------------------- |
| `value`                  | `number \| null \| undefined`         | Current numeric value                     |
| `uomId`                  | `number \| null \| undefined`         | Current UOM ID                            |
| `uomOptions`             | `Array<{ id: number; code: string }>` | Available UOM options                     |
| `onChange`               | `(value: number \| null) => void`     | Called when value changes                 |
| `onUomChange`            | `(uomId: number) => void`             | Called when UOM changes                   |
| `disabled`               | `boolean`                             | Disabled state                            |
| All standard input props |                                       | `placeholder`, `min`, `max`, `step`, etc. |

## Integration Tips

1. **Fetching UOM Options**: Use `uomResource.list.queryOptions()` from `@/features/uom/api.ts`

2. **Form Validation**: Both components work with TanStack Form's field validation

3. **Accessibility**: Both components support keyboard navigation and screen readers

4. **Decimal Values**: Handles decimal values appropriately without unnecessary formatting

5. **Consistent Styling**: Follows existing Shadcn UI patterns with Tailwind CSS design tokens

## Best Practices

- Use `NumberInputGroupAddon` when UOM is fixed or implied by context
- Use `NumberInputGroup` when user needs to select both quantity and unit
- Cache UOM options if used across multiple forms
- Provide meaningful labels and descriptions for accessibility
- Use appropriate `min`, `max`, and `step` props for numeric validation
