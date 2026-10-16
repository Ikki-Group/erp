import { useId } from 'react'

import { cn } from '@/lib/utils'

import {
	NumberField as NumberFieldPrimitive,
	NumberFieldDecrement,
	NumberFieldGroup,
	NumberFieldIncrement,
	NumberFieldInput,
} from '@/components/reui/number-field'

import { Label } from '@/components/ui/label'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError } from '../field-error.tsx'

export interface NumberFieldProps {
	id?: string
	label: string
	min?: number
	max?: number
	step?: number
	description?: string
	disabled?: boolean
	className?: string
}

/** Numeric stepper field. The field's value type is `number | null`. */
export function NumberField({
	id,
	label,
	min,
	max,
	step = 1,
	description,
	disabled,
	className,
}: NumberFieldProps) {
	const field = useFieldContext<number | null>()
	const generatedId = useId()
	const fieldId = id ?? generatedId
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined
	const describedBy =
		[description && `${fieldId}-description`, error && `${fieldId}-error`]
			.filter(Boolean)
			.join(' ') || undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<NumberFieldPrimitive
				id={fieldId}
				name={field.name}
				value={field.state.value ?? null}
				onValueChange={(v) => field.handleChange(v ?? null)}
				onBlur={field.handleBlur}
				min={min}
				max={max}
				step={step}
				disabled={disabled}
			>
				<NumberFieldGroup>
					<NumberFieldDecrement aria-label={`Decrease ${label}`} />
					<NumberFieldInput aria-invalid={!!error} aria-describedby={describedBy} />
					<NumberFieldIncrement aria-label={`Increase ${label}`} />
				</NumberFieldGroup>
			</NumberFieldPrimitive>
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
