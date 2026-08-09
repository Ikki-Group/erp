import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface FormSelectOption {
	label: string
	value: string
}

interface FormSelectProps {
	label: string
	options: FormSelectOption[]
	value?: string
	onValueChange?: (value: string | null) => void
	placeholder?: string
	error?: string
	description?: string
	disabled?: boolean
	className?: string
	children?: ReactNode
}

export function FormSelect({
	label,
	options,
	value,
	onValueChange,
	placeholder = 'Select...',
	error,
	description,
	disabled,
	className,
}: FormSelectProps) {
	const fieldId = label.toLowerCase().replace(/\s+/g, '-')

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<Select value={value} onValueChange={onValueChange} disabled={disabled}>
				<SelectTrigger className="w-full" aria-invalid={!!error}>
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
