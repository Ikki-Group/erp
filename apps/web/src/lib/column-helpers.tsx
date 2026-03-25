import { createColumnHelper } from '@tanstack/react-table'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { toDateTimeStamp } from '@/lib/formatter'

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
 * Creates a date column that auto-formats using `toDateTimeStamp`.
 *
 * @example
 * ```ts
 * const columns = [
 *   ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada' })),
 * ]
 * ```
 */
export function dateColumn<TData>(
  opts: {
    header?: string
  } & ColumnOptions
): Partial<ColumnDef<TData, Date | string | number>> {
  return {
    header: opts.header ?? 'Tanggal',
    cell: ({ getValue }: CellContext<TData, Date | string | number>) => {
      const value = getValue()
      if (!value) return '-'
      return <p className='text-nowrap'>{toDateTimeStamp(value)}</p>
    },
    enableSorting: opts.enableSorting ?? false,
    size: opts.size,
    meta: opts.meta,
  }
}

/**
 * Creates an action column (pinned right, no sort/hide/resize).
 *
 * @example
 * ```ts
 * ch.display(actionColumn({
 *   cell: ({ row }) => <Button size="icon-sm"><PencilIcon /></Button>
 * }))
 * ```
 */
export function actionColumn<TData>(opts: {
  cell: ColumnDef<TData>['cell']
  size?: number
  id?: string
}): ColumnDef<TData> {
  return {
    id: opts.id ?? 'action',
    header: '',
    cell: opts.cell,
    size: opts.size ?? 60,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
  }
}

/**
 * Text column with optional truncation.
 *
 * @example
 * ```ts
 * ch.accessor('name', textColumn({ header: 'Nama', size: 200 }))
 * ```
 */
export function textColumn<TData>(
  opts: { header: string } & ColumnOptions
): Partial<ColumnDef<TData, string>> {
  return {
    header: opts.header,
     
    cell: ({ getValue }: CellContext<TData, string>) => getValue() ?? '-',
    enableSorting: opts.enableSorting ?? false,
    size: opts.size,
    meta: opts.meta,
  }
}

/**
 * Badge/status column — renders any ReactNode returned by the `render` function.
 *
 * @example
 * ```ts
 * ch.accessor('isActive', statusColumn({
 *   header: 'Status',
 *   render: (value) => <ActiveStatusBadge status={toActiveStatus(value)} />,
 * }))
 * ```
 */
export function statusColumn<TData, TValue>(
  opts: {
    header: string
    render: (value: TValue, row: TData) => ReactNode
  } & ColumnOptions
): Partial<ColumnDef<TData, TValue>> {
  return {
    header: opts.header,
    cell: ({ getValue, row }: CellContext<TData, TValue>) =>
      opts.render(getValue(), row.original),
    enableSorting: opts.enableSorting ?? false,
    size: opts.size,
    meta: opts.meta,
  }
}

/**
 * Numeric column with optional formatting.
 *
 * @example
 * ```ts
 * ch.accessor('currentQty', numericColumn({
 *   header: 'Qty',
 *   format: (v) => v.toLocaleString('id-ID'),
 * }))
 * ```
 */
export function numericColumn<TData>(
  opts: {
    header: string
    format?: (value: number) => string
  } & ColumnOptions
): Partial<ColumnDef<TData, number>> {
  return {
    header: opts.header,
    cell: ({ getValue }: CellContext<TData, number>) => {
      const value = getValue()
       
      if (value == null) return '-'
      const formatted = opts.format ? opts.format(value) : String(value)
      return <p className='text-right tabular-nums'>{formatted}</p>
    },
    enableSorting: opts.enableSorting ?? false,
    size: opts.size,
    meta: {
      className: 'text-right',
      ...opts.meta,
    },
  }
}
