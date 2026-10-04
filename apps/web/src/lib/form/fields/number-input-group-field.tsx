import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import type {
	NumberInputGroupAddonProps,
	NumberInputGroupProps,
} from '@/components/ui/number-input-group'
import { NumberInputGroup, NumberInputGroupAddon } from '@/components/ui/number-input-group'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError } from '../field-error.tsx'

export interface NumberInputGroupAddonFieldProps extends Omit<
	NumberInputGroupAddonProps,
	'value' | 'onChange'
> {
	label: string
	uomLabel: string
	description?: string
	className?: string
}

/**
 * Numeric input field with a static UOM label.
 * The field's value type is `number | null`.
 */
export function NumberInputGroupAddonField({
	label,
	uomLabel,
	description,
	disabled,
	className,
	...props
}: NumberInputGroupAddonFieldProps) {
	const field = useFieldContext<number | null>()
	const fieldId = field.name
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<NumberInputGroupAddon
				id={fieldId}
				uomLabel={uomLabel}
				value={field.state.value ?? undefined}
				onChange={(e) => {
					const inputValue = e.target.value
					if (inputValue === '') {
						field.handleChange(null)
					} else {
						const numValue = Number.parseFloat(inputValue)
						if (!Number.isNaN(numValue)) {
							field.handleChange(numValue)
						}
					}
				}}
				onBlur={field.handleBlur}
				disabled={disabled}
				aria-invalid={!!error}
				{...props}
			/>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}

export interface NumberInputGroupFieldProps extends Omit<
	NumberInputGroupProps,
	'value' | 'uomId' | 'onChange' | 'onUomChange'
> {
	label: string
	description?: string
	className?: string
}

/**
 * Numeric input field with an editable UOM dropdown.
 * This component binds to TWO separate form fields: one for quantity, one for UOM ID.
 *
 * Usage note: You must use the `useFieldContext` hook separately for each field:
 * - Call `useFieldContext<number | null>()` for the quantity field
 * - Call `useFieldContext<number | null>()` for the UOM field
 *
 * @example
 * ```tsx
 * const quantityField = useFieldContext<number | null>()
 * const uomField = useFieldContext<number | null>()
 *
 * <NumberInputGroupField
 *   quantityField={quantityField}
 *   uomField={uomField}
 *   uomOptions={uomOptions}
 *   label="Quantity"
 * />
 * ```
 */
export function NumberInputGroupField({
	label,
	description,
	disabled,
	className,
	uomOptions,
	quantityField,
	uomField,
	...props
}: NumberInputGroupFieldProps & {
	/** Field context for the numeric quantity value */
	quantityField: ReturnType<typeof useFieldContext<number | null>>
	/** Field context for the UOM ID value */
	uomField: ReturnType<typeof useFieldContext<number | null>>
}) {
	const fieldId = quantityField.name
	const error = quantityField.state.meta.isTouched
		? formatFieldError(quantityField.state.meta.errors)
		: undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<NumberInputGroup
				id={fieldId}
				value={quantityField.state.value}
				uomId={uomField.state.value}
				uomOptions={uomOptions}
				onChange={(value) => quantityField.handleChange(value)}
				onUomChange={(uomId) => uomField.handleChange(uomId)}
				onBlur={quantityField.handleBlur}
				disabled={disabled}
				aria-invalid={!!error}
				{...props}
			/>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
