import { cn } from '@/lib/utils'

export interface CurrencyDisplayProps {
	/** Numeric value (integer for IDR prices, or decimal for costs). */
	value: number | string
	/** Currency code prefix. Defaults to 'Rp'. */
	currency?: string
	/** Locale for number formatting. Defaults to 'id-ID'. */
	locale?: string
	/** Show positive values with a '+' sign. Useful for trends/diffs. */
	showSign?: boolean
	/** Apply color based on sign (green positive, red negative). */
	colored?: boolean
	/** Additional class for the wrapper span. */
	className?: string
}

/**
 * Formatted currency display for IDR values.
 * Handles integer prices (Rp 85.000) and decimal costs (Rp 82.340,50).
 */
export function CurrencyDisplay({
	value,
	currency = 'Rp',
	locale = 'id-ID',
	showSign = false,
	colored = false,
	className,
}: CurrencyDisplayProps) {
	const numValue = typeof value === 'string' ? Number.parseFloat(value) : value

	if (Number.isNaN(numValue)) {
		return <span className={cn('text-muted-foreground', className)}>—</span>
	}

	const formatted = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: Number.isInteger(numValue) ? 0 : 2,
	}).format(Math.abs(numValue))

	const sign = numValue > 0 && showSign ? '+' : numValue < 0 ? '-' : ''

	return (
		<span
			className={cn(
				'tabular-nums',
				colored && numValue > 0 && 'text-success-foreground',
				colored && numValue < 0 && 'text-destructive',
				className,
			)}
		>
			{sign}
			{currency} {formatted}
		</span>
	)
}
