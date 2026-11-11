import type { ReactNode } from 'react'

import type { TableFeatures } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table/data-table'
import type { ResourceListModel } from '@/components/data-table/use-resource-list'

import { Button } from '@/components/ui/button'

import { EmptyState } from './empty-state'
import { PageError } from './page-error'
import { PageShell } from './page-shell'

export interface EntityListEmptyState {
	title: string
	description?: string
	icon?: ReactNode
}

export interface EntityListPageProps<TFeatures extends TableFeatures, TData extends object> {
	title: string
	description?: string
	list: ResourceListModel<TFeatures, TData>
	/** Rendered once in the header and reused in the unfiltered record-empty state. */
	createAction?: ReactNode
	actions?: ReactNode
	emptyState?: EntityListEmptyState
	emptyMessage?: string
	toolbar?: ReactNode
	onRowClick?: (row: TData) => void
	className?: string
}

/** Resource query states never remove the page's navigation, actions, or filters. */
export function EntityListPage<TFeatures extends TableFeatures, TData extends object>({
	title,
	description,
	list,
	createAction,
	actions,
	emptyState,
	emptyMessage,
	toolbar,
	onRowClick,
	className,
}: EntityListPageProps<TFeatures, TData>) {
	const showRecordEmpty = list.state === 'record-empty' && emptyState
	return (
		<PageShell
			title={title}
			description={description}
			actions={
				actions || createAction ? (
					<>
						{actions}
						{createAction}
					</>
				) : undefined
			}
			className={className}
		>
			<div className="min-w-0 space-y-4" aria-busy={list.isRefreshing}>
				{list.state === 'refresh-error' && (
					<div
						role="alert"
						className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm"
					>
						<p>Could not refresh this list. Showing the last loaded results.</p>
						<Button size="sm" variant="outline" disabled={list.isRefreshing} onClick={list.retry}>
							Retry
						</Button>
					</div>
				)}
				{list.isRefreshing && (
					<p role="status" className="text-xs text-muted-foreground">
						Refreshing results…
					</p>
				)}
				{showRecordEmpty || list.state === 'initial-error' ? (
					<>
						{toolbar}
						{list.state === 'initial-error' ? (
							<PageError onRetry={list.retry} />
						) : (
							emptyState && <EmptyState {...emptyState} action={createAction} />
						)}
					</>
				) : (
					<DataTable
						table={list.table}
						recordCount={list.recordCount}
						isLoading={list.state === 'initial-loading'}
						emptyMessage={emptyMessage}
						toolbar={toolbar}
						onRowClick={onRowClick}
					/>
				)}
			</div>
		</PageShell>
	)
}
