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
	label: string
	/** Currency prefix shown inside the input, e.g. 'Rp'. */
	prefix?: string
	placeholder?: string
	description?: string
	disabled?: boolean
	className?: string
}

/**
 * Currency amount input. The field's value type is the canonical numeric
 * `string` every money DTO expects ("82340.5", never "82.340,5") — the same
 * convention as `TextField` for decimal literals (see `MaterialFormSchema`'s
 * `minStock`). Displays and accepts the value in Indonesian
 * thousands-grouped, comma-decimal notation; use `CurrencyDisplay`
 * (`@/components/shared/currency-display`) for the read-only equivalent.
 */
export function CurrencyField({
	label,
	prefix = 'Rp',
	placeholder = '0',
	description,
	disabled,
	className,
}: CurrencyFieldProps) {
	const field = useFieldContext<string>()
	const fieldId = field.name
	const error = field.state.meta.isTouched ? formatFieldError(field.state.meta.errors) : undefined

	return (
		<div className={cn('space-y-1.5', className)}>
			<Label htmlFor={fieldId}>{label}</Label>
			<InputGroup>
				{prefix && (
					<InputGroupAddon>
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
					aria-describedby={error ? `${fieldId}-error` : undefined}
					disabled={disabled}
				/>
			</InputGroup>
			{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
			{error && (
				<p id={`${fieldId}-error`} className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	)
}
