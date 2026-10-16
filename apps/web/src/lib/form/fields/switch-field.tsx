import { useId } from 'react'

import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError } from '../field-error.tsx'

export interface SwitchFieldProps {
	id?: string
	label: string
	description?: string
	disabled?: boolean
	className?: string
}

export function SwitchField({ id, label, description, disabled, className }: SwitchFieldProps) {
	const field = useFieldContext<boolean>()
	const generatedId = useId()
	const fieldId = id ?? generatedId
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined
	const describedBy =
		[description && `${fieldId}-description`, error && `${fieldId}-error`]
			.filter(Boolean)
			.join(' ') || undefined

	return (
		<div className={cn('flex items-center justify-between gap-3', className)}>
			<div className="space-y-0.5">
				<Label htmlFor={fieldId}>{label}</Label>
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
			<Switch
				id={fieldId}
				name={field.name}
				onBlur={field.handleBlur}
				aria-invalid={!!error}
				aria-describedby={describedBy}
				checked={field.state.value ?? false}
				onCheckedChange={(checked) => field.handleChange(checked)}
				disabled={disabled}
			/>
		</div>
	)
}
