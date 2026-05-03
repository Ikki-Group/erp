import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { useDataTable } from '@/hooks/use-data-table'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

import { inventoryReportApi } from '@/features/reporting'
import type { InventoryReportRequestDto, StockLevelDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/inventory/stock')({
	component: InventoryStockReport,
})

const columns: ColumnDef<StockLevelDto>[] = [
	{
		accessorKey: 'productName',
		header: 'Produk',
		size: 250,
	},
	{
		accessorKey: 'sku',
		header: 'SKU',
		size: 120,
	},
	{
		accessorKey: 'currentStock',
		header: 'Stok Saat Ini',
		size: 150,
		cell: ({ row }) => {
			const isLow = row.original.currentStock <= row.original.reorderLevel
			return (
				<span className={`font-mono font-medium tabular-nums ${isLow ? 'text-rose-600' : ''}`}>
					{row.original.currentStock} {row.original.unit}
				</span>
			)
		},
	},
	{
		accessorKey: 'reorderLevel',
		header: 'Reorder Level',
		size: 150,
		cell: ({ row }) => (
			<span className="font-mono tabular-nums text-muted-foreground">
				{row.original.reorderLevel} {row.original.unit}
			</span>
		),
	},
	{
		id: 'status',
		header: 'Status',
		size: 120,
		cell: ({ row }) =>
			row.original.currentStock <= row.original.reorderLevel ? (
				<BadgeDot variant="destructive-outline">Low Stock</BadgeDot>
			) : (
				<BadgeDot variant="success-outline">Aman</BadgeDot>
			),
	},
]

function InventoryStockReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data, isLoading } = useQuery(
		inventoryReportApi.stockLevels.query(filter as InventoryReportRequestDto),
	)

	const stockLevels: StockLevelDto[] = data?.data?.data ?? []

	const table = useDataTable({
		columns,
		data: stockLevels,
		pageCount: 1,
		rowCount: stockLevels.length,
		ds: { pagination: { limit: 50, page: 1 }, search: '', filters: {} } as any,
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Ringkasan Stok"
				description="Level stok produk dan status ketersediaan."
			/>
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} showGroupBy={false} />
					</Card.Content>
				</Card>

				<DataTableCard
					title="Daftar Level Stok"
					table={table as any}
					isLoading={isLoading}
					recordCount={stockLevels.length}
				/>
			</Page.Content>
		</Page>
	)
}
