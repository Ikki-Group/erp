import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { Bar, BarChart, XAxis, YAxis } from 'recharts'

import { useDataTable } from '@/hooks/use-data-table'

import { ChartCard } from '@/components/blocks/data-display/chart-card'
import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'
import { customColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import { Card } from '@/components/ui/card'

import { inventoryReportApi } from '@/features/reporting'
import type { InventoryReportRequestDto, StockValueDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/inventory/stock-value')({
	component: InventoryStockValueReport,
})

const chartConfig = { totalValue: { label: 'Nilai Stok', color: 'oklch(var(--primary))' } }

const ch = createColumnHelper<StockValueDto>()
const columns = [
	ch.accessor('productName', textColumn({ header: 'Produk', size: 250 })),
	ch.accessor('sku', textColumn({ header: 'SKU', size: 120 })),
	ch.accessor(
		'quantity',
		customColumn({
			header: 'Qty',
			cell: (v) => <span className="font-mono tabular-nums">{v}</span>,
			size: 100,
		}),
	),
	ch.accessor(
		'unitCost',
		customColumn({
			header: 'Harga Satuan',
			cell: (v) => (
				<span className="font-mono tabular-nums">Rp {Number(v).toLocaleString('id-ID')}</span>
			),
			size: 150,
		}),
	),
	ch.accessor(
		'totalValue',
		customColumn({
			header: 'Total Nilai',
			cell: (v) => (
				<span className="font-mono font-medium tabular-nums">
					Rp {Number(v).toLocaleString('id-ID')}
				</span>
			),
			size: 180,
		}),
	),
]

function InventoryStockValueReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data, isLoading } = useQuery(
		inventoryReportApi.stockValue.query(filter as InventoryReportRequestDto),
	)

	const stockValues: StockValueDto[] = data?.data?.data ?? []

	const table = useDataTable({
		columns,
		data: stockValues,
		pageCount: 1,
		rowCount: stockValues.length,
		ds: { pagination: { limit: 50, page: 1 }, search: '', filters: {} } as any,
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Nilai Stok"
				description="Nilai inventaris berdasarkan harga satuan dan kuantitas."
			/>
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} showGroupBy={false} />
					</Card.Content>
				</Card>

				<ChartCard title="Top 10 Nilai Stok" description="Produk dengan nilai stok tertinggi">
					<ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
						<BarChart data={stockValues.slice(0, 10)} layout="vertical" margin={{ left: -20 }}>
							<XAxis type="number" hide />
							<YAxis
								dataKey="productName"
								type="category"
								tickLine={false}
								axisLine={false}
								fontSize={12}
								width={140}
							/>
							<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
							<Bar dataKey="totalValue" fill="oklch(var(--primary))" radius={4} />
						</BarChart>
					</ChartContainer>
				</ChartCard>

				<DataTableCard
					title="Detail Nilai Stok"
					table={table as any}
					isLoading={isLoading}
					recordCount={stockValues.length}
				/>
			</Page.Content>
		</Page>
	)
}
