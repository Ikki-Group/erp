import * as React from 'react'
import type { ReactNode } from 'react'

import { createColumnHelper } from '@tanstack/react-table'
import type { CellContext, ColumnDef } from '@tanstack/react-table'

import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Column Helper Utilities                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Type-safe helper for creating table columns.
 * @example
 * ```ts
 * const ch = createColumnHelper<User>()
 * const columns = [
 *   ch.accessor('id', textColumn({ header: 'ID' })),
 * ]
 * ```
 */
export { createColumnHelper }

export type ColumnOptions<_TData> = {
	size?: number
	enableSorting?: boolean
	enableHiding?: boolean
	meta?: { className?: string; label?: string; headerTitle?: string }
}

import { DataGridCell } from './data-grid-cell'

/* -------------------------------------------------------------------------- */
/*  Helper Functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Text column with optional truncation.
 */
export function textColumn<TData, TValue extends React.ReactNode = any>(
	opts: { header: string } & ColumnOptions<TData>,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: ({ getValue }: CellContext<TData, TValue>) => (
			<DataGridCell.Text value={getValue()} className={opts.meta?.className} />
		),
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: opts.meta,
	}
}

/**
 * Specialized column for rendering standard links (e.g. primary identifiers).
 * Renders the primary label and an optional secondary description.
 */
export function linkColumn<TData, TValue = any>(
	opts: { header: string; render: (value: TValue, row: TData) => ReactNode } & ColumnOptions<TData>,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: ({ getValue, row }: CellContext<TData, TValue>) => opts.render(getValue(), row.original),
		enableSorting: opts.enableSorting ?? true,
		size: opts.size ?? 250,
		meta: opts.meta,
	}
}

/**
 * Creates a date column that auto-formats using `toDateTimeStamp`.
 */
export function dateColumn<TData>(
	opts: { header?: string } & ColumnOptions<TData>,
): Partial<ColumnDef<TData, any>> {
	return {
		header: opts.header ?? 'Tanggal',
		cell: ({ getValue }: CellContext<TData, any>) => (
			// oxlint-disable-next-line typescript/no-unsafe-assignment
			<DataGridCell.Date value={getValue()} className={opts.meta?.className} />
		),
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: opts.meta,
	}
}

/**
 * Creates an action column. Hardcoded to disable sort/hide/resize.
 * Typically pinned to the right.
 */
export function actionColumn<TData>(opts: {
	cell: (props: CellContext<TData, any>) => ReactNode
	size?: number
	id?: string
}): ColumnDef<TData, any> {
	return {
		id: opts.id ?? 'action',
		header: '',
		cell: opts.cell,
		size: opts.size ?? 100,
		enableSorting: false,
		enableHiding: false,
		enableResizing: false,
		enablePinning: true,
	} as ColumnDef<TData, any>
}

/**
 * Badge/status column — renders any ReactNode returned by the `render` function.
 */
export function statusColumn<TData, TValue = any>(
	opts: { header: string; render: (value: TValue, row: TData) => ReactNode } & ColumnOptions<TData>,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: ({ getValue, row }: CellContext<TData, TValue>) => opts.render(getValue(), row.original),
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: opts.meta,
	}
}

/**
 * Numeric column formatted with `toNumber`. Right aligns by default.
 */
export function numberColumn<TData, TValue extends number | string | null | undefined = any>(
	opts: {
		header: string
		render?: (value: TValue, row: TData) => ReactNode
	} & ColumnOptions<TData>,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: ({ getValue, row }: CellContext<TData, TValue>) => {
			const value = getValue()
			if (opts.render) return opts.render(value, row.original)
			return <DataGridCell.Number value={value} className={opts.meta?.className} />
		},
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: { ...opts.meta, className: cn('text-right', opts.meta?.className) },
	}
}

/**
 * Currency column formatted with `toCurrency`. Right aligns by default.
 */
export function currencyColumn<TData, TValue extends number | string | null | undefined = any>(
	opts: {
		header: string
		render?: (value: TValue, row: TData) => ReactNode
	} & ColumnOptions<TData>,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: ({ getValue, row }: CellContext<TData, TValue>) => {
			const value = getValue()
			if (opts.render) return opts.render(value, row.original)
			return <DataGridCell.Currency value={value} className={opts.meta?.className} />
		},
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: { ...opts.meta, className: cn('text-right', opts.meta?.className) },
	}
}
