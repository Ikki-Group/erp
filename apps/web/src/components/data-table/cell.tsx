import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { CurrencyDisplay } from '@/components/shared/currency-display'

/**
 * Header renderer for a right-aligned numeric column — pairs with
 * `NumericCell`/`CurrencyCell`. TanStack Table's `header` accepts a plain
 * string (left-aligned by the table's own styles) or a render function; this
 * is just that render function, named so every numeric column doesn't
 * re-write `() => <div className="text-right">{label}</div>` by hand.
 *
 * @example
 * col.accessor('quantity', { header: rightAlignedHeader('Stok'), cell: ... })
 */
export function rightAlignedHeader(label: ReactNode) {
	return function RightAlignedHeader() {
		return <div className="text-right">{label}</div>
	}
}

/** The standard "no value" placeholder — a muted em dash. */
export function EmptyCell({ className }: { className?: string }) {
	return <span className={cn('text-muted-foreground', className)}>—</span>
}

interface NumericCellProps {
	value: number | string | null | undefined
	/** Short unit label shown after the number, muted (e.g. a UOM code). */
	unit?: ReactNode
	/** Locale for digit grouping. Defaults to 'id-ID'. */
	locale?: string
	/** Mutes the whole cell — e.g. a "min stock" reference value next to the real quantity. */
	muted?: boolean
	className?: string
}

/**
 * Right-aligned, monospaced, locale-grouped number — the standard
 * quantity/count cell. Pair the column's `header` with `rightAlignedHeader`
 * so the header and cell line up.
 */
export function NumericCell({
	value,
	unit,
	locale = 'id-ID',
	muted = false,
	className,
}: NumericCellProps) {
	if (value === null || value === undefined) {
		return <EmptyCell className={cn('block text-right', className)} />
	}

	const numValue = typeof value === 'string' ? Number.parseFloat(value) : value

	if (Number.isNaN(numValue)) {
		return <EmptyCell className={cn('block text-right', className)} />
	}

	return (
		<div
			className={cn(
				'text-right font-mono text-sm tabular-nums',
				muted && 'text-muted-foreground',
				className,
			)}
		>
			{numValue.toLocaleString(locale)}
			{unit && <span className="text-muted-foreground"> {unit}</span>}
		</div>
	)
}

interface CurrencyCellProps {
	value: number | string | null | undefined
	currency?: string
	locale?: string
	className?: string
}

/** Right-aligned IDR currency cell — a table-ready wrapper around `CurrencyDisplay`. */
export function CurrencyCell({ value, currency, locale, className }: CurrencyCellProps) {
	if (value === null || value === undefined) {
		return <EmptyCell className={cn('block text-right', className)} />
	}

	return (
		<div className={cn('text-right font-mono text-sm', className)}>
			<CurrencyDisplay value={value} currency={currency} locale={locale} />
		</div>
	)
}

interface TextCellProps {
	value: ReactNode
	/** Truncates with an ellipsis and shows the full string in a title tooltip. */
	truncate?: boolean
	muted?: boolean
	/** Small monospaced text — the convention for codes/SKUs. */
	mono?: boolean
	className?: string
}

/** Left-aligned text cell with optional truncation + title tooltip for long values. */
export function TextCell({
	value,
	truncate = false,
	muted = false,
	mono = false,
	className,
}: TextCellProps) {
	return (
		<span
			title={truncate && typeof value === 'string' ? value : undefined}
			className={cn(
				truncate && 'block truncate',
				mono ? 'font-mono text-xs' : 'text-sm',
				muted && 'text-muted-foreground',
				className,
			)}
		>
			{value}
		</span>
	)
}

interface DateCellProps {
	value: string | number | Date | null | undefined
	/** Also show the time of day. Defaults to date only. */
	withTime?: boolean
	locale?: string
	className?: string
}

/** Formatted date/datetime cell — `id-ID` medium date style by default, matching the rest of the app. */
export function DateCell({ value, withTime = false, locale = 'id-ID', className }: DateCellProps) {
	if (value === null || value === undefined) {
		return <EmptyCell className={className} />
	}

	const date = value instanceof Date ? value : new Date(value)

	if (Number.isNaN(date.getTime())) {
		return <EmptyCell className={className} />
	}

	const formatted = new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeStyle: withTime ? 'short' : undefined,
	}).format(date)

	return <span className={cn('text-sm', className)}>{formatted}</span>
}
