import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSignIcon, TrendingUpIcon, TrendingDownIcon, HashIcon } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'
import { insightsReportApi } from '@/features/reporting/api'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'

export default function ProfitabilityReportRoute() {
	const [dateRange, setDateRange] = useState({ dateFrom: new Date(Date.now() - 30 * 86400000), dateTo: new Date() })
	const { data, isLoading } = useQuery(insightsReportApi.profitability.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	const fmt = (d: Date | string) => (typeof d === 'string' ? new Date(d) : d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
	const totalRevenue = chartData.reduce((s, d) => s + Number(d.revenue), 0)
	const totalProfit = chartData.reduce((s, d) => s + Number(d.profit), 0)
	const totalCogs = chartData.reduce((s, d) => s + Number(d.cogs), 0)
	const avgMargin = chartData.length > 0 ? chartData.reduce((s, d) => s + d.margin, 0) / chartData.length : 0

	return (
		<Page size="xl">
			<Page.BlockHeader title="Profitabilitas" description="Analisis revenue, COGS, dan profit." />
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<CardStat title="Total Revenue" value={String(totalRevenue)} icon={DollarSignIcon} />
					<CardStat title="COGS" value={String(totalCogs)} icon={TrendingDownIcon} />
					<CardStat title="Profit" value={String(totalProfit)} icon={TrendingUpIcon} />
					<CardStat title="Margin Rata-rata" value={`${avgMargin.toFixed(1)}%`} icon={HashIcon} />
				</div>
				<ChartCard title="Tren Profitabilitas" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="date" tickFormatter={fmt} className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
								<Legend />
								<Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Revenue" />
								<Area type="monotone" dataKey="cogs" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="COGS" />
								<Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Profit" />
							</AreaChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
