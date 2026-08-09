import type { TableFeatures } from '@tanstack/react-table'
import type { Table } from '@tanstack/react-table'

import {
	DataGrid,
	type DataGridLayoutProps,
	type DataGridTableInstance,
} from '@/components/reui/data-grid/data-grid'
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination'
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table'

import { cn } from '@/lib/utils'

interface DataTableProps<TFeatures extends TableFeatures, TData extends object> {
	table: Table<TFeatures, TData>
	recordCount?: number
	isLoading?: boolean
	emptyMessage?: string
	onRowClick?: (row: TData) => void
	showPagination?: boolean
	className?: string
}

export function DataTable<TFeatures extends TableFeatures, TData extends object>({
	table,
	recordCount = 0,
	isLoading = false,
	emptyMessage = 'No records found.',
	onRowClick,
	showPagination = true,
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
			headerBackground: true,
		},
	}

	return (
		<div className={cn('space-y-4', className)}>
			<DataGrid
				{...layoutProps}
				table={table as unknown as DataGridTableInstance<TData>}
			>
				<DataGridTable />
				{showPagination && <DataGridPagination />}
			</DataGrid>
		</div>
	)
}
