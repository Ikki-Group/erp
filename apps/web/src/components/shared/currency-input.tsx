import { toCanonicalCurrency, toDisplayCurrency } from '@/lib/currency.ts'
import { cn } from '@/lib/utils'

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from '@/components/ui/input-group'

export interface CurrencyInputProps {
	/** Numeric amount, e.g. `50000`. `undefined`/`0` render as an empty field. */
	value: number | undefined
	onValueChange: (value: number) => void
	/** Currency prefix shown inside the input, e.g. 'Rp'. */
	prefix?: string
	placeholder?: string
	disabled?: boolean
	className?: string
	id?: string
	'aria-label'?: string
}

/**
 * Standalone currency amount input for money state that lives outside the
 * `useEntityForm` engine (e.g. POS checkout's ad hoc payment-entry list) —
 * use `field.CurrencyField` (`@/lib/form/fields/currency-field`) instead for
 * anything backed by a `form.AppField`. Same Indonesian thousands-grouped,
 * comma-decimal display convention as `CurrencyField`; the caller deals in
 * a plain `number`, not the canonical numeric string DTOs expect.
 */
export function CurrencyInput({
	value,
	onValueChange,
	prefix = 'Rp',
	placeholder = '0',
	disabled,
	className,
	id,
	'aria-label': ariaLabel,
}: CurrencyInputProps) {
	const display = toDisplayCurrency(value ? String(value) : '')

	return (
		<InputGroup className={cn(className)}>
			{prefix && (
				<InputGroupAddon>
					<InputGroupText>{prefix}</InputGroupText>
				</InputGroupAddon>
			)}
			<InputGroupInput
				id={id}
				inputMode="decimal"
				value={display}
				onChange={(e) => {
					const canonical = toCanonicalCurrency(e.target.value)
					onValueChange(canonical ? Number(canonical) : 0)
				}}
				placeholder={placeholder}
				disabled={disabled}
				aria-label={ariaLabel}
			/>
		</InputGroup>
	)
}
