import { useId } from 'react'

import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import type {
	NumberInputGroupAddonProps,
	NumberInputGroupProps,
} from '@/components/ui/number-input-group'
import { NumberInputGroup, NumberInputGroupAddon } from '@/components/ui/number-input-group'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError, type FieldErrors } from '../field-error.tsx'

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
	id,
	label,
	uomLabel,
	description,
	disabled,
	className,
	...props
}: NumberInputGroupAddonFieldProps) {
	const field = useFieldContext<number | null>()
	const generatedId = useId()
	const fieldId = id ?? generatedId
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined
	const describedBy =
		[
			props['aria-describedby'],
			description && `${fieldId}-description`,
			error && `${fieldId}-error`,
		]
			.filter(Boolean)
			.join(' ') || undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<NumberInputGroupAddon
				id={fieldId}
				name={field.name}
				uomLabel={uomLabel}
				value={field.state.value ?? ''}
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
				{...props}
				aria-invalid={!!error}
				aria-describedby={describedBy}
			/>
			{description && (
				<p id={`${fieldId}-description`} className="text-xs text-muted-foreground">
					{description}
				</p>
			)}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}

interface NumericFieldBinding {
	name: string
	state: {
		value: number | null
		meta: { isTouched: boolean; errors: FieldErrors }
	}
	handleChange: (value: number | null) => void
	handleBlur: () => void
}

export interface NumberInputGroupFieldProps extends Omit<
	NumberInputGroupProps,
	'value' | 'uomId' | 'onChange' | 'onUomChange'
> {
	label: string
	description?: string
	className?: string
	quantityField: NumericFieldBinding
	uomField: NumericFieldBinding
}

/**
 * Bind quantity and UOM using the distinct field instances supplied by render props:
 *
 * ```tsx
 * <form.AppField name="quantity">
 *   {(quantityField) => (
 *     <form.AppField name="uomId">
 *       {(uomField) => (
 *         <NumberInputGroupField
 *           quantityField={quantityField}
 *           uomField={uomField}
 *           uomOptions={uomOptions}
 *           label="Quantity"
 *         />
 *       )}
 *     </form.AppField>
 *   )}
 * </form.AppField>
 * ```
 */
export function NumberInputGroupField({
	id,
	label,
	description,
	disabled,
	className,
	uomOptions,
	quantityField,
	uomField,
	uomTriggerProps,
	...props
}: NumberInputGroupFieldProps) {
	const generatedId = useId()
	const fieldId = id ?? generatedId
	const uomId = uomTriggerProps?.id ?? `${fieldId}-uom`
	const error = quantityField.state.meta.isTouched
		? formatFieldError(quantityField.state.meta.errors)
		: undefined
	const uomError = uomField.state.meta.isTouched
		? formatFieldError(uomField.state.meta.errors)
		: undefined
	const describedBy =
		[
			props['aria-describedby'],
			description && `${fieldId}-description`,
			error && `${fieldId}-error`,
		]
			.filter(Boolean)
			.join(' ') || undefined
	const uomDescribedBy =
		[
			uomTriggerProps?.['aria-describedby'],
			description && `${fieldId}-description`,
			uomError && `${uomId}-error`,
		]
			.filter(Boolean)
			.join(' ') || undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<NumberInputGroup
				id={fieldId}
				name={quantityField.name}
				uomName={uomField.name}
				value={quantityField.state.value}
				uomId={uomField.state.value}
				uomOptions={uomOptions}
				onChange={(value) => quantityField.handleChange(value)}
				onUomChange={(uomId) => uomField.handleChange(uomId)}
				onBlur={quantityField.handleBlur}
				disabled={disabled}
				{...props}
				aria-invalid={!!error}
				aria-describedby={describedBy}
				uomTriggerProps={{
					'aria-label': `${label}: unit of measure`,
					...uomTriggerProps,
					id: uomId,
					onBlur: (event) => {
						uomField.handleBlur()
						uomTriggerProps?.onBlur?.(event)
					},
					'aria-invalid': !!uomError,
					'aria-describedby': uomDescribedBy,
				}}
			/>
			{description && (
				<p id={`${fieldId}-description`} className="text-xs text-muted-foreground">
					{description}
				</p>
			)}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
			{uomError && (
				<p id={`${uomId}-error`} className="text-xs text-destructive">
					{uomError}
				</p>
			)}
		</div>
	)
}
