import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError } from '../field-error.tsx'

export interface SelectFieldOption {
	label: string
	value: string
}

export interface SelectFieldProps {
	label: string
	options: SelectFieldOption[]
	placeholder?: string
	description?: string
	disabled?: boolean
	className?: string
}

/**
 * Select bound to the field context. The field value is always a `string`
 * (matches the `<select>`/combobox convention used across the app) —
 * numeric ids are stored as their string form and converted at the form's
 * `onSubmit` boundary (see `toId` in `@/lib/form/transform`).
 */
export function SelectField({
	label,
	options,
	placeholder = 'Select...',
	description,
	disabled,
	className,
}: SelectFieldProps) {
	const field = useFieldContext<string>()
	const fieldId = field.name
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Select
				value={field.state.value || undefined}
				onValueChange={(v) => field.handleChange(v ?? '')}
				disabled={disabled}
			>
				<SelectTrigger id={fieldId} className="w-full" aria-invalid={!!error}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
