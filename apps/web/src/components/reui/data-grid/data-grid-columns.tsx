import { createColumnHelper } from '@tanstack/react-table'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import * as React from 'react'
import type { ReactNode } from 'react'

import { toCurrency, toDateTimeStamp, toNumber } from '@/lib/formatter'

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

type ColumnOptions = {
  size?: number
  enableSorting?: boolean
  enableHiding?: boolean
  meta?: { className?: string; label?: string }
}

/**
 * Text column with optional truncation.
 */
export function textColumn<TData, TValue = string>(
  opts: { header: string } & ColumnOptions,
): Partial<ColumnDef<TData, TValue>> {
  return {
    header: opts.header,
    cell: ({ getValue }: CellContext<TData, TValue>) => (getValue() ?? '-') as ReactNode,
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
  opts: { header: string; render: (value: TValue, row: TData) => ReactNode } & ColumnOptions,
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
  opts: { header?: string } & ColumnOptions,
): Partial<ColumnDef<TData, Date | string | number | null | undefined>> {
  return {
    header: opts.header ?? 'Tanggal',
    cell: ({ getValue }: CellContext<TData, Date | string | number | null | undefined>) => {
      const value = getValue()
      if (!value) return '-'
      return <p className="text-nowrap">{toDateTimeStamp(value)}</p>
    },
    enableSorting: opts.enableSorting ?? false,
    size: opts.size,
    meta: opts.meta,
  }
}

/**
 * Creates an action column. Hardcoded to disable sort/hide/resize.
 * Typically pinned to the right.
 */
export function actionColumn<TData>(opts: { cell: ColumnDef<TData>['cell']; size?: number; id?: string }): any {
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

/**
 * Badge/status column — renders any ReactNode returned by the `render` function.
 */
export function statusColumn<TData, TValue = any>(
  opts: { header: string; render: (value: TValue, row: TData) => ReactNode } & ColumnOptions,
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
export function numberColumn<TData, TValue = number | null | undefined>(
  opts: { header: string; render?: (value: TValue, row: TData) => ReactNode } & ColumnOptions,
): Partial<ColumnDef<TData, TValue>> {
  return {
    header: opts.header,
    cell: ({ getValue, row }: CellContext<TData, TValue>) => {
      const value = getValue()
      if (opts.render) return opts.render(value, row.original)
      if (value === null || value === undefined) return '-'
      return <p className="text-right tabular-nums">{toNumber(value as any)}</p>
    },
    enableSorting: opts.enableSorting ?? false,
    size: opts.size,
    meta: { className: 'text-right', ...opts.meta },
  }
}

/**
 * Currency column formatted with `toCurrency`. Right aligns by default.
 */
export function currencyColumn<TData, TValue = number | string | null | undefined>(
  opts: { header: string; render?: (value: TValue, row: TData) => ReactNode } & ColumnOptions,
): Partial<ColumnDef<TData, TValue>> {
  return {
    header: opts.header,
    cell: ({ getValue, row }: CellContext<TData, TValue>) => {
      const value = getValue()
      if (opts.render) return opts.render(value, row.original)
      if (value === null || value === undefined) return '-'
      return <p className="text-right tabular-nums">{toCurrency(value)}</p>
    },
    enableSorting: opts.enableSorting ?? false,
    size: opts.size,
    meta: { className: 'text-right', ...opts.meta },
  }
}
