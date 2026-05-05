import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PackageIcon, TrendingUpIcon, HashIcon } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'
import { insightsReportApi } from '@/features/reporting/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function InventoryTurnoverReportRoute() {
	const [dateRange, setDateRange] = useState({ dateFrom: new Date(Date.now() - 30 * 86400000), dateTo: new Date() })
	const { data, isLoading } = useQuery(insightsReportApi.turnover.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	const avgTurnover = chartData.length > 0 ? chartData.reduce((s, d) => s + d.turnoverRatio, 0) / chartData.length : 0
	const avgDays = chartData.length > 0 ? chartData.reduce((s, d) => s + d.daysInInventory, 0) / chartData.length : 0

	return (
		<Page size="xl">
			<Page.BlockHeader title="Inventory Turnover" description="Analisis perputaran inventory." />
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat title="Turnover Rata-rata" value={avgTurnover.toFixed(2)} icon={TrendingUpIcon} />
					<CardStat title="Hari Rata-rata" value={avgDays.toFixed(0)} icon={HashIcon} />
					<CardStat title="Jumlah Material" value={String(summary?.count ?? 0)} icon={PackageIcon} />
				</div>
				<ChartCard title="Turnover Ratio per Material" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="materialName" className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
								<Legend />
								<Bar dataKey="turnoverRatio" fill="#6366f1" name="Turnover" />
								<Bar dataKey="daysInInventory" fill="#f59e0b" name="Days" />
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
