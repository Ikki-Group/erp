import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { StoreIcon, DollarSignIcon, TrendingUpIcon, HashIcon } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'
import { insightsReportApi } from '@/features/reporting/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function LocationPerformanceReportRoute() {
	const [dateRange, setDateRange] = useState({ dateFrom: new Date(Date.now() - 30 * 86400000), dateTo: new Date() })
	const { data, isLoading } = useQuery(insightsReportApi.location.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	const totalRevenue = chartData.reduce((s, d) => s + Number(d.totalRevenue), 0)
	const totalSales = chartData.reduce((s, d) => s + Number(d.totalSales), 0)
	const totalProfit = chartData.reduce((s, d) => s + Number(d.profit), 0)
	const avgOrderValue = chartData.length > 0 ? chartData.reduce((s, d) => s + Number(d.avgOrderValue), 0) / chartData.length : 0

	return (
		<Page size="xl">
			<Page.BlockHeader title="Lokasi Performa" description="Kinerja lokasi berdasarkan revenue dan profit." />
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<CardStat title="Total Revenue" value={String(totalRevenue)} icon={DollarSignIcon} />
					<CardStat title="Total Penjualan" value={String(totalSales)} icon={HashIcon} />
					<CardStat title="Total Profit" value={String(totalProfit)} icon={TrendingUpIcon} />
					<CardStat title="Rata-rata Order" value={avgOrderValue.toFixed(0)} icon={StoreIcon} />
				</div>
				<ChartCard title="Revenue & Profit per Lokasi" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="locationName" className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
								<Legend />
								<Bar dataKey="totalRevenue" fill="#6366f1" name="Revenue" />
								<Bar dataKey="profit" fill="#10b981" name="Profit" />
								<Bar dataKey="totalCost" fill="#ef4444" name="Cost" />
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
