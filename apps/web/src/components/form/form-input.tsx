import type { ComponentProps } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { cn } from '@/lib/utils'

interface FormInputProps extends ComponentProps<'input'> {
	label: string
	error?: string
	description?: string
}

export function FormInput({ label, error, description, id, className, ...props }: FormInputProps) {
	const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={inputId}>{label}</Label>
			<Input
				id={inputId}
				aria-invalid={!!error}
				aria-describedby={error ? `${inputId}-error` : undefined}
				{...props}
			/>
			{description && !error && (
				<p className="text-xs text-muted-foreground">{description}</p>
			)}
			{error && (
				<p id={`${inputId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
