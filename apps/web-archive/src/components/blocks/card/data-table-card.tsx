import type { ReactNode } from 'react'

import type { Table } from '@tanstack/react-table'

import { DataGrid } from '@/components/reui/data-grid/data-grid'
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination'
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table'

import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface DataTableCardProps<TData extends object> {
	title: string
	table: Table<TData>
	isLoading?: boolean
	recordCount?: number
	action?: ReactNode
	toolbar?: ReactNode
	onRowClick?: (row: TData) => void
}

export function DataTableCard<TData extends object>({
	title,
	table,
	isLoading,
	action,
	toolbar,
	recordCount = 0,
	onRowClick,
}: DataTableCardProps<TData>) {
	return (
		<DataGrid
			table={table}
			recordCount={recordCount}
			tableClassNames={{ edgeCell: 'px-4' }}
			isLoading={isLoading}
			loadingMode="spinner"
			tableLayout={{ cellBorder: false, columnsPinnable: true }}
			onRowClick={onRowClick}
		>
			<Card className="gap-0!" size="sm">
				<CardHeader className="flex items-center justify-between px-4 pb-3 border-b border-border">
					<CardTitle className="text-base">{title}</CardTitle>
					{action && <CardAction>{action}</CardAction>}
				</CardHeader>
				{toolbar && <div className="px-3 py-3 border-b border-border bg-muted/30">{toolbar}</div>}
				<div className="w-full">
					<ScrollArea>
						<DataGridTable />
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
				<CardFooter className="px-4 py-3 border-t border-border bg-muted/10">
					<DataGridPagination />
				</CardFooter>
			</Card>
		</DataGrid>
	)
}
