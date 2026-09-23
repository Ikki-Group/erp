import type { ReactNode } from 'react'

import type { Table, TableFeatures } from '@tanstack/react-table'

import { cn } from '@/lib/utils'

import {
	DataGrid,
	type DataGridLayoutProps,
	type DataGridTableInstance,
} from '@/components/reui/data-grid/data-grid'
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination'
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table'

interface DataTableProps<TFeatures extends TableFeatures, TData extends object> {
	table: Table<TFeatures, TData>
	recordCount?: number
	isLoading?: boolean
	emptyMessage?: string
	onRowClick?: (row: TData) => void
	showPagination?: boolean
	toolbar?: ReactNode
	className?: string
}

export function DataTable<TFeatures extends TableFeatures, TData extends object>({
	table,
	recordCount = 0,
	isLoading = false,
	emptyMessage = 'No records found.',
	onRowClick,
	showPagination = true,
	toolbar,
	className,
}: DataTableProps<TFeatures, TData>) {
	const layoutProps: DataGridLayoutProps<TData> = {
		recordCount,
		isLoading,
		emptyMessage,
		onRowClick,
		loadingMode: 'skeleton',
		tableLayout: {
			headerSticky: true,
			rowBorder: true,
			headerBackground: false,
			width: 'fixed',
		},
	}

	return (
		<div className={cn('space-y-4', className)}>
			<div
				data-slot="data-table"
				className={cn(
					'min-w-0 max-w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs',
					'**:data-[slot=data-grid-pagination]:border-t **:data-[slot=data-grid-pagination]:bg-muted/20',
					'**:data-[slot=data-grid-pagination]:px-4 **:data-[slot=data-grid-pagination]:py-3',
				)}
			>
				{toolbar && (
					<div className="border-b border-border/60 bg-muted/10 px-4 py-3">{toolbar}</div>
				)}
				<DataGrid
					{...layoutProps}
					table={table as unknown as DataGridTableInstance<TData>}
					tableClassNames={{
						header: 'bg-muted/15',
						headerRow: 'border-b border-border/70',
						bodyRow:
							'group transition-colors hover:bg-accent/35 data-[state=selected]:bg-accent/55',
					}}
				>
					<div
						data-slot="data-table-scroll"
						role="region"
						aria-label="Scrollable table"
						tabIndex={0}
						className="data-table-horizontal-scroll min-w-0 max-w-full touch-pan-x overscroll-x-contain overflow-x-scroll overflow-y-hidden"
					>
						<DataGridTable />
					</div>
					{showPagination && <DataGridPagination />}
				</DataGrid>
			</div>
		</div>
	)
}
