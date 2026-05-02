import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { TrendingUpIcon, DollarSignIcon, ShoppingCartIcon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { CardStat } from '@/components/blocks/card/card-stat'
import { ChartCard } from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'

import { salesReportApi } from '@/features/reporting'
import type { SalesReportRequestDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/sales/revenue')({
	component: SalesRevenueReport,
})

const chartConfig = {
	revenue: { label: 'Pendapatan', color: 'oklch(var(--primary))' },
	orderCount: { label: 'Jumlah Order', color: 'oklch(var(--chart-2))' },
}

function SalesRevenueReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data } = useQuery(salesReportApi.revenue.query(filter as SalesReportRequestDto))

	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary

	const totalRevenue = Number(summary?.total ?? 0)
	const avgRevenue = Number(summary?.average ?? 0)
	const totalOrders = chartData.reduce((sum, d) => sum + d.orderCount, 0)

	return (
		<Page>
			<Page.BlockHeader
				title="Laporan Pendapatan"
				description="Analisis pendapatan penjualan berdasarkan periode."
			/>
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} />
					</Card.Content>
				</Card>

				<div className="grid gap-4 md:grid-cols-3">
					<CardStat
						title="Total Pendapatan"
						value={`Rp ${totalRevenue.toLocaleString('id-ID')}`}
						icon={DollarSignIcon}
					/>
					<CardStat
						title="Rata-rata / Periode"
						value={`Rp ${avgRevenue.toLocaleString('id-ID')}`}
						icon={TrendingUpIcon}
					/>
					<CardStat title="Total Order" value={String(totalOrders)} icon={ShoppingCartIcon} />
				</div>

				<ChartCard title="Tren Pendapatan" description="Grafik pendapatan dan jumlah order">
					<ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
						<AreaChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
							<defs>
								<linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.4} />
									<stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(v) =>
									new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
								}
							/>
							<YAxis hide />
							<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
							<Area
								dataKey="revenue"
								type="monotone"
								fill="url(#fillRev)"
								stroke="oklch(var(--primary))"
								strokeWidth={2}
							/>
							<ChartLegend content={<ChartLegendContent />} />
						</AreaChart>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
