import * as React from 'react'

import { Link } from '@tanstack/react-router'

import { toCurrency, toDate, toDateTimeStamp, toNumber } from '@/lib/formatter'
import { cn } from '@/lib/utils'

interface DataGridCellLabelAndDescProps {
	label: React.ReactNode
	desc?: React.ReactNode
	className?: string
}

interface DataGridCellTextProps {
	value: React.ReactNode | string | number | null | undefined
	className?: string
}

interface DataGridCellDateProps {
	value: Date | string | number | null | undefined
	variant?: 'date' | 'datetime'
	className?: string
}

interface DataGridCellNumberProps {
	value: number | string | null | undefined
	className?: string
}

interface DataGridCellCurrencyProps {
	value: number | string | null | undefined
	className?: string
}

/**
 * Renders a primary label and an optional secondary description in a stacked layout.
 * Best for ID columns or main entity names.
 */
function DataGridCellLabelAndDesc({ label, desc, className }: DataGridCellLabelAndDescProps) {
	return (
		<div className={cn('flex flex-col gap-0.5 min-w-0 py-1', className)}>
			<div className="font-medium text-foreground truncate">{label}</div>
			{desc && <div className="text-xs text-muted-foreground truncate">{desc}</div>}
		</div>
	)
}

/**
 * Standard text cell with truncation and fallback.
 */
function DataGridCellText({ value, className }: DataGridCellTextProps) {
	return (
		<span className={cn('truncate block text-sm', className)}>
			{value !== null && value !== undefined && value !== '' ? value : '-'}
		</span>
	)
}

/**
 * Date cell with ERP standard formatting. Default is datetime.
 */
function DataGridCellDate({ value, variant = 'datetime', className }: DataGridCellDateProps) {
	if (!value) return <span className="text-muted-foreground">-</span>

	const formatted = variant === 'datetime' ? toDateTimeStamp(value) : toDate(value)

	return <span className={cn('text-nowrap tabular-nums text-sm', className)}>{formatted}</span>
}

/**
 * Numeric cell with localized formatting and right alignment.
 */
function DataGridCellNumber({ value, className }: DataGridCellNumberProps) {
	return (
		<div className={cn('text-right tabular-nums w-full text-sm', className)}>
			{value === null || value === undefined || value === '' ? '-' : toNumber(value)}
		</div>
	)
}

/**
 * Currency cell (IDR) with localized formatting, semi-bold font, and right alignment.
 */
function DataGridCellCurrency({ value, className }: DataGridCellCurrencyProps) {
	return (
		<div className={cn('text-right tabular-nums w-full font-medium text-sm', className)}>
			{value === null || value === undefined || value === '' ? '-' : toCurrency(value)}
		</div>
	)
}

/**
 * Composable Link cell using TanStack Router.
 */
function DataGridCellLink(props: React.ComponentProps<typeof Link>) {
	return (
		<Link
			{...props}
			className={cn(
				'font-medium text-primary hover:underline transition-all cursor-pointer inline-block text-sm',
				props.className,
			)}
		/>
	)
}

export const DataGridCell = {
	LabelAndDesc: DataGridCellLabelAndDesc,
	Text: DataGridCellText,
	Date: DataGridCellDate,
	Number: DataGridCellNumber,
	Currency: DataGridCellCurrency,
	Link: DataGridCellLink,
}
