import { useId } from 'react'

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
	id?: string
	label: string
	options: SelectFieldOption[]
	placeholder?: string
	description?: string
	disabled?: boolean
	className?: string
}

/** Select for string-valued fields. Use `IdSelectField` for numeric foreign keys. */
export function SelectField({
	id,
	label,
	options,
	placeholder = 'Select...',
	description,
	disabled,
	className,
}: SelectFieldProps) {
	const field = useFieldContext<string>()
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
			<Select
				items={options}
				name={field.name}
				value={field.state.value || null}
				onValueChange={(v) => field.handleChange(v ?? '')}
				disabled={disabled}
			>
				<SelectTrigger
					id={fieldId}
					className="w-full"
					onBlur={field.handleBlur}
					aria-invalid={!!error}
					aria-describedby={describedBy}
				>
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
