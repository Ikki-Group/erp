import type { ComponentProps, ReactNode } from 'react'

import type { ColumnDef, ColumnDefBase } from '@tanstack/react-table'

import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { createActionColumn } from '@/components/shared/action-column'
import type { ActionColumnOptions } from '@/components/shared/action-column'
import { StatusBadge, type StatusBadgeVariant } from '@/components/shared/status-badge'

import {
	CurrencyCell,
	DateCell,
	EmptyCell,
	NumericCell,
	rightAlignedHeader,
	TextCell,
} from './cell'

type FieldKey<T, TValue> = {
	[K in keyof T]-?: NonNullable<T[K]> extends TValue ? K : never
}[keyof T] &
	string

type Options<T extends object, K extends keyof T> = ColumnDefBase<DataGridFeatures, T, T[K]> & {
	id?: string
	header?: string | ColumnDef<DataGridFeatures, T, T[K]>['header']
}

type CellOptions<T extends object, K extends keyof T, TProps> = Options<T, K> & {
	cellProps?: Omit<TProps, 'value'>
}

interface StatusLabel {
	label: ReactNode
	variant?: StatusBadgeVariant
}

/** Typed field keys and TanStack overrides, with the shared ERP cell conventions by default. */
export function createEntityColumns<T extends object>() {
	function column<K extends keyof T & string>(
		key: K,
		options: Options<T, K>,
		render: (value: T[K]) => ReactNode,
	): ColumnDef<DataGridFeatures, T, T[K]> {
		return { accessorKey: key, cell: ({ row }) => render(row.original[key]), ...options }
	}

	return {
		code<K extends FieldKey<T, string | number>>(
			key: K,
			{ cellProps, ...options }: CellOptions<T, K, ComponentProps<typeof TextCell>> = {},
		) {
			return column(key, options, (value) =>
				value == null ? (
					<EmptyCell />
				) : (
					<TextCell value={String(value)} mono muted {...cellProps} />
				),
			)
		},
		text<K extends FieldKey<T, string | number>>(
			key: K,
			{ cellProps, ...options }: CellOptions<T, K, ComponentProps<typeof TextCell>> = {},
		) {
			return column(key, options, (value) =>
				value == null ? <EmptyCell /> : <TextCell value={String(value)} truncate {...cellProps} />,
			)
		},
		/** String fields must contain decimal numbers, as in the resource decimal DTOs. */
		quantity<K extends FieldKey<T, number | string>>(
			key: K,
			{ cellProps, ...options }: CellOptions<T, K, ComponentProps<typeof NumericCell>> = {},
		) {
			return column(
				key,
				{
					...options,
					header:
						typeof options.header === 'string'
							? rightAlignedHeader(options.header)
							: options.header,
				},
				(value) => <NumericCell value={value == null ? null : Number(value)} {...cellProps} />,
			)
		},
		money<K extends FieldKey<T, number | string>>(
			key: K,
			{ cellProps, ...options }: CellOptions<T, K, ComponentProps<typeof CurrencyCell>> = {},
		) {
			return column(
				key,
				{
					...options,
					header:
						typeof options.header === 'string'
							? rightAlignedHeader(options.header)
							: options.header,
				},
				(value) => <CurrencyCell value={value == null ? null : Number(value)} {...cellProps} />,
			)
		},
		date<K extends FieldKey<T, string | number | Date>>(
			key: K,
			{ cellProps, ...options }: CellOptions<T, K, ComponentProps<typeof DateCell>> = {},
		) {
			return column(key, options, (value) => (
				<DateCell value={value as string | number | Date | null | undefined} {...cellProps} />
			))
		},
		status<K extends FieldKey<T, string | number>>(
			key: K,
			labels: Record<Extract<NonNullable<T[K]>, string | number>, StatusLabel>,
			options: Options<T, K> = {},
		) {
			return column(key, options, (value) => {
				if (value == null) return <EmptyCell />
				const status = labels[value as Extract<NonNullable<T[K]>, string | number>]
				return status ? (
					<StatusBadge variant={status.variant}>{status.label}</StatusBadge>
				) : (
					<TextCell value={String(value)} />
				)
			})
		},
		booleanStatus<K extends FieldKey<T, boolean>>(
			key: K,
			{
				labels = {
					true: { label: 'Active', variant: 'success' },
					false: { label: 'Inactive', variant: 'outline' },
				},
				...options
			}: Options<T, K> & { labels?: Record<'true' | 'false', StatusLabel> } = {},
		) {
			return column(key, options, (value) => {
				if (value == null) return <EmptyCell />
				const status = labels[value ? 'true' : 'false']
				return <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
			})
		},
		actions: (options: ActionColumnOptions<T>) => createActionColumn(options),
	}
}
