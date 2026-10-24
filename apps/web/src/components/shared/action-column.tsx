import type { ReactNode } from 'react'

import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'

import { ActionMenu } from './action-menu'
import type { ActionMenuItem } from './action-menu'

export type ActionColumnItem<TData> =
	| (ActionMenuItem & { visible?: (row: TData) => boolean })
	| false
	| null
	| undefined

export interface ActionColumnOptions<TData> {
	id?: string
	size?: number
	label?: string
	getItems: (row: TData) => readonly ActionColumnItem<TData>[]
	className?: string
	/** Optional content for rows that have no visible actions. */
	empty?: ReactNode
}

/** Creates a typed row-action column without leaking table boilerplate into routes. */
export function createActionColumn<TData extends object>(
	options: ActionColumnOptions<TData>,
): ColumnDef<DataGridFeatures, TData> {
	const column = createColumnHelper<DataGridFeatures, TData>()

	return column.display({
		id: options.id ?? 'actions',
		size: options.size ?? 60,
		cell: ({ row }) => {
			const items = options
				.getItems(row.original)
				.filter((item): item is Exclude<ActionColumnItem<TData>, false | null | undefined> =>
					Boolean(item),
				)
				.filter((item) => item.visible?.(row.original) ?? true)
				.map(({ visible: _visible, ...item }) => item)

			if (items.length === 0) return options.empty ?? null
			return <ActionMenu items={items} label={options.label} className={options.className} />
		},
	})
}
