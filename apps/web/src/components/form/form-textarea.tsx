import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface FormTextareaProps extends ComponentProps<'textarea'> {
	label: string
	error?: string
	description?: string
	wrapperClassName?: string
}

export function FormTextarea({
	label,
	error,
	description,
	id,
	className,
	wrapperClassName,
	...props
}: FormTextareaProps) {
	const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

	return (
		<div className={cn('space-y-1.5', wrapperClassName)}>
			<Label htmlFor={inputId}>{label}</Label>
			<Textarea
				id={inputId}
				aria-invalid={!!error}
				aria-describedby={error ? `${inputId}-error` : undefined}
				className={className}
				{...props}
			/>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${inputId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
