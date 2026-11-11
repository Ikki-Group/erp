import { useId } from 'react'

import { toCanonicalCurrency, toDisplayCurrency } from '@/lib/currency.ts'
import { cn } from '@/lib/utils'

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'

import { useFieldContext } from '../contexts.ts'
import { formatFieldError } from '../field-error.tsx'

export interface CurrencyFieldProps {
	id?: string
	label: string
	/** Currency prefix shown inside the input, e.g. 'Rp'. */
	prefix?: string
	placeholder?: string
	description?: string
	disabled?: boolean
	className?: string
}

/**
 * Currency amount input bound to a canonical numeric string ("82340.5").
 * Displays and accepts Indonesian thousands-grouped, comma-decimal notation.
 * Use `CurrencyDisplay` for the read-only equivalent.
 */
export function CurrencyField({
	id,
	label,
	prefix = 'Rp',
	placeholder = '0',
	description,
	disabled,
	className,
}: CurrencyFieldProps) {
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
			<InputGroup>
				{prefix && (
					<InputGroupAddon className="border-r pr-2">
						<InputGroupText>{prefix}</InputGroupText>
					</InputGroupAddon>
				)}
				<InputGroupInput
					id={fieldId}
					name={field.name}
					inputMode="decimal"
					value={toDisplayCurrency(field.state.value ?? '')}
					onBlur={field.handleBlur}
					onChange={(e) => field.handleChange(toCanonicalCurrency(e.target.value))}
					placeholder={placeholder}
					aria-invalid={!!error}
					aria-describedby={describedBy}
					disabled={disabled}
					className="text-right font-mono tabular-nums"
				/>
			</InputGroup>
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
