import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { Bar, BarChart, XAxis, YAxis } from 'recharts'

import { useDataTable } from '@/hooks/use-data-table'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { ChartCard } from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'
import { textColumn, customColumn } from '@/components/reui/data-grid/data-grid-columns'

import { Card } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

import { salesReportApi } from '@/features/reporting'
import type { SalesReportRequestDto, TopProductDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/sales/products')({
	component: SalesProductsReport,
})

const chartConfig = { totalRevenue: { label: 'Pendapatan', color: 'oklch(var(--primary))' } }

const ch = createColumnHelper<TopProductDto>()
const columns = [
	ch.accessor('productName', textColumn({ header: 'Produk', size: 250 })),
	ch.accessor('sku', textColumn({ header: 'SKU', size: 120 })),
	ch.accessor(
		'totalQuantity',
		customColumn({
			header: 'Qty Terjual',
			cell: (v) => <span className="font-medium tabular-nums">{v}</span>,
			size: 120,
		}),
	),
	ch.accessor(
		'totalRevenue',
		customColumn({
			header: 'Total Pendapatan',
			cell: (v) => (
				<span className="font-mono font-medium tabular-nums">
					Rp {Number(v).toLocaleString('id-ID')}
				</span>
			),
			size: 180,
		}),
	),
]

function SalesProductsReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data, isLoading } = useQuery(
		salesReportApi.topProducts.query(filter as SalesReportRequestDto),
	)

	const topProducts: TopProductDto[] = data?.data?.data ?? []

	const table = useDataTable({
		columns,
		data: topProducts,
		pageCount: 1,
		rowCount: topProducts.length,
		ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Performa Produk"
				description="Produk terlaris berdasarkan pendapatan dan volume penjualan."
			/>
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} showGroupBy={false} />
					</Card.Content>
				</Card>

				<ChartCard title="Top 10 Produk" description="Berdasarkan total pendapatan">
					<ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
						<BarChart data={topProducts} layout="vertical" margin={{ left: -20 }}>
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
							<Bar dataKey="totalRevenue" fill="oklch(var(--primary))" radius={4} />
						</BarChart>
					</ChartContainer>
				</ChartCard>

				<DataTableCard
					title="Detail Produk"
					table={table as any}
					isLoading={isLoading}
					recordCount={topProducts.length}
				/>
			</Page.Content>
		</Page>
	)
}
