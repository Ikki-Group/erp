import { cn } from '@/lib/utils'

import {
	NumberField,
	NumberFieldDecrement,
	NumberFieldGroup,
	NumberFieldIncrement,
	NumberFieldInput,
} from '@/components/reui/number-field'

import { Label } from '@/components/ui/label'

export interface FormNumberFieldProps {
	label: string
	value?: number
	onChange?: (value: number | null) => void
	min?: number
	max?: number
	step?: number
	placeholder?: string
	error?: string
	description?: string
	disabled?: boolean
	className?: string
}

export function FormNumberField({
	label,
	value,
	onChange,
	min,
	max,
	step = 1,
	error,
	description,
	disabled,
	className,
}: FormNumberFieldProps) {
	const fieldId = label.toLowerCase().replace(/\s+/g, '-')

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<NumberField
				id={fieldId}
				value={value}
				onValueChange={onChange}
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
			</NumberField>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
