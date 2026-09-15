import { cn } from '@/lib/utils'

import {
	NumberField as NumberFieldPrimitive,
	NumberFieldDecrement,
	NumberFieldGroup,
	NumberFieldIncrement,
	NumberFieldInput,
} from '@/components/reui/number-field'

import { Label } from '@/components/ui/label'

import { formatFieldError } from '../field-error.tsx'
import { useFieldContext } from '../contexts.ts'

export interface NumberFieldProps {
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
	label,
	min,
	max,
	step = 1,
	description,
	disabled,
	className,
}: NumberFieldProps) {
	const field = useFieldContext<number | null>()
	const fieldId = field.name
	const error = field.state.meta.isTouched
		? formatFieldError(field.state.meta.errors)
		: undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<NumberFieldPrimitive
				id={fieldId}
				value={field.state.value ?? undefined}
				onValueChange={(v) => field.handleChange(v ?? null)}
				onBlur={field.handleBlur}
				min={min}
				max={max}
				step={step}
				disabled={disabled}
				aria-invalid={!!error}
			>
				<NumberFieldGroup>
					<NumberFieldDecrement />
					<NumberFieldInput />
					<NumberFieldIncrement />
				</NumberFieldGroup>
			</NumberFieldPrimitive>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
