import type { ReactNode } from 'react'

import type { Table, TableFeatures } from '@tanstack/react-table'

import { cn } from '@/lib/utils'

import { DataTable } from '@/components/data-table/data-table'

import { EmptyState } from './empty-state'
import { PageShell } from './page-shell'

export interface EntityListEmptyState {
	title: string
	description?: string
	action?: ReactNode
	icon?: ReactNode
}

export interface EntityListPageProps<TFeatures extends TableFeatures, TData extends object> {
	title: string
	description?: string
	actions?: ReactNode
	table: Table<TFeatures, TData>
	recordCount?: number
	isLoading?: boolean
	isEmpty?: boolean
	emptyState?: EntityListEmptyState
	emptyMessage?: string
	toolbar?: ReactNode
	onRowClick?: (row: TData) => void
	className?: string
}

/** Shared list-page composition for resource tables. */
export function EntityListPage<TFeatures extends TableFeatures, TData extends object>({
	title,
	description,
	actions,
	table,
	recordCount,
	isLoading,
	isEmpty = false,
	emptyState,
	emptyMessage,
	toolbar,
	onRowClick,
	className,
}: EntityListPageProps<TFeatures, TData>) {
	return (
		<PageShell title={title} description={description} actions={actions} className={className}>
			{isEmpty && emptyState ? (
				<EmptyState
					title={emptyState.title}
					description={emptyState.description}
					icon={emptyState.icon}
					action={emptyState.action}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={recordCount}
					isLoading={isLoading}
					emptyMessage={emptyMessage}
					toolbar={toolbar}
					onRowClick={onRowClick}
					className={cn('min-w-0')}
				/>
			)}
		</PageShell>
	)
}
