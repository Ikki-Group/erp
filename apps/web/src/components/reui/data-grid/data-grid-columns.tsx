import type { ReactNode } from 'react'

import { createColumnHelper } from '@tanstack/react-table'
import type { CellContext, ColumnDef } from '@tanstack/react-table'

import { cn } from '@/lib/utils'

import {
	CellText,
	CellDate,
	CellNumber,
	CellCurrency,
	CellMenu,
	type CellMenuItem,
} from './data-grid-cell'

/* -------------------------------------------------------------------------- */
/*  Re-exports                                                                */
/* -------------------------------------------------------------------------- */

export { createColumnHelper }

/* -------------------------------------------------------------------------- */
/*  Column Meta                                                               */
/* -------------------------------------------------------------------------- */

export interface ColumnMetaDef {
	className?: string
	label?: string
	headerTitle?: string
}

/* -------------------------------------------------------------------------- */
/*  Shared Options                                                             */
/* -------------------------------------------------------------------------- */

export interface ColumnBaseOptions {
	size?: number
	enableSorting?: boolean
	enableHiding?: boolean
	meta?: ColumnMetaDef
}

/* -------------------------------------------------------------------------- */
/*  Column Helpers                                                            */
/* -------------------------------------------------------------------------- */

/** Text column with truncation and fallback. */
export function textColumn<TData, TValue>(
	opts: { header: string } & ColumnBaseOptions,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: (ctx: CellContext<TData, TValue>) => (
			<CellText value={ctx.getValue() as React.ReactNode} className={opts.meta?.className} />
		),
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: opts.meta,
	}
}

/** Date column with ERP standard formatting. Default: datetime. */
export function dateColumn<TData>(
	opts: { header?: string; variant?: 'date' | 'datetime' } & ColumnBaseOptions,
): Partial<ColumnDef<TData, Date | string | number | null | undefined>> {
	return {
		header: opts.header ?? 'Tanggal',
		cell: (ctx: CellContext<TData, Date | string | number | null | undefined>) => (
			<CellDate value={ctx.getValue()} variant={opts.variant} className={opts.meta?.className} />
		),
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: opts.meta,
	}
}

/** Numeric column with localized formatting. Right-aligned. */
export function numberColumn<TData, TValue extends number | string | null | undefined>(
	opts: {
		header: string
		render?: (value: TValue, row: TData) => ReactNode
	} & ColumnBaseOptions,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: (ctx: CellContext<TData, TValue>) => {
			const value = ctx.getValue()
			if (opts.render) return opts.render(value, ctx.row.original)
			return <CellNumber value={value} className={opts.meta?.className} />
		},
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: { ...opts.meta, className: cn('text-right', opts.meta?.className) },
	}
}

/** Currency column (IDR) with localized formatting. Right-aligned. */
export function currencyColumn<TData, TValue extends number | string | null | undefined>(
	opts: {
		header: string
		render?: (value: TValue, row: TData) => ReactNode
	} & ColumnBaseOptions,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: (ctx: CellContext<TData, TValue>) => {
			const value = ctx.getValue()
			if (opts.render) return opts.render(value, ctx.row.original)
			return <CellCurrency value={value} className={opts.meta?.className} />
		},
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: { ...opts.meta, className: cn('text-right', opts.meta?.className) },
	}
}

/**
 * Custom cell column — full control over rendering.
 * Use this instead of `statusColumn` / `linkColumn`.
 */
export function customColumn<TData, TValue = any>(
	opts: {
		header: string
		cell: (value: TValue, row: TData, ctx: CellContext<TData, TValue>) => ReactNode
		enableSorting?: boolean
	} & ColumnBaseOptions,
): Partial<ColumnDef<TData, TValue>> {
	return {
		header: opts.header,
		cell: (ctx: CellContext<TData, TValue>) =>
			opts.cell(ctx.getValue() as TValue, ctx.row.original, ctx),
		enableSorting: opts.enableSorting ?? false,
		size: opts.size,
		meta: opts.meta,
	}
}

/**
 * Action column powered by CellMenu dropdown.
 * Pinned right, no sort/hide/resize.
 */
export function menuColumn<TData>(opts: {
	items: (row: TData) => CellMenuItem[]
	id?: string
	size?: number
	label?: string
	icon?: ReactNode
}): ColumnDef<TData, unknown> {
	return {
		id: opts.id ?? 'action',
		header: '',
		cell: ({ row }: CellContext<TData, unknown>) => (
			<div className="flex items-center justify-end px-2">
				<CellMenu items={opts.items(row.original)} label={opts.label} icon={opts.icon} />
			</div>
		),
		size: opts.size ?? 60,
		enableSorting: false,
		enableHiding: false,
		enableResizing: false,
		enablePinning: true,
	}
}

/**
 * Action column with custom cell renderer.
 * Pinned right, no sort/hide/resize.
 */
export function actionColumn<TData>(opts: {
	cell: (props: CellContext<TData, unknown>) => ReactNode
	size?: number
	id?: string
}): ColumnDef<TData, unknown> {
	return {
		id: opts.id ?? 'action',
		header: '',
		cell: opts.cell,
		size: opts.size ?? 100,
		enableSorting: false,
		enableHiding: false,
		enableResizing: false,
		enablePinning: true,
	}
}

/* -------------------------------------------------------------------------- */
/*  Deprecated (kept for migration)                                           */
/* -------------------------------------------------------------------------- */

/** @deprecated Use `customColumn` instead. */
export const statusColumn = customColumn

/** @deprecated Use `customColumn` instead. */
export const linkColumn = customColumn
