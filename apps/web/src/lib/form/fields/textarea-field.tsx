import { useId, type ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError } from '../field-error.tsx'

export interface TextareaFieldProps extends Omit<ComponentProps<'textarea'>, 'value' | 'onChange'> {
	label: string
	description?: string
	wrapperClassName?: string
}

export function TextareaField({
	label,
	description,
	id,
	className,
	wrapperClassName,
	...props
}: TextareaFieldProps) {
	const field = useFieldContext<string>()
	const generatedId = useId()
	const fieldId = id ?? generatedId
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined

	return (
		<div className={cn('space-y-1.5', wrapperClassName)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Textarea
				id={fieldId}
				name={field.name}
				value={field.state.value ?? ''}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				className={className}
				{...props}
				aria-invalid={!!error}
				aria-describedby={
					[
						props['aria-describedby'],
						description && `${fieldId}-description`,
						error && `${fieldId}-error`,
					]
						.filter(Boolean)
						.join(' ') || undefined
				}
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
