import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { UsersIcon, TrendingUpIcon } from 'lucide-react'
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'

import { crmReportApi } from '@/features/reporting/api'

export default function CustomerGrowthReportRoute() {
	const [dateRange, setDateRange] = useState({
		dateFrom: new Date(Date.now() - 30 * 86400000),
		dateTo: new Date(),
	})
	const { data, isLoading } = useQuery(
		crmReportApi.customerGrowth.query({ ...dateRange, groupBy: 'day' }),
	)
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	const fmt = (d: Date | string) =>
		(typeof d === 'string' ? new Date(d) : d).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
		})
	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Pertumbuhan Pelanggan"
				description="Analisis pertumbuhan pelanggan baru dan total pelanggan aktif."
			/>
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat title="Total Pelanggan Baru" value={summary?.total ?? '0'} icon={UsersIcon} />
					<CardStat title="Rata-rata" value={summary?.average ?? '0'} icon={TrendingUpIcon} />
					<CardStat title="Periode" value={String(summary?.count ?? 0)} icon={TrendingUpIcon} />
				</div>
				<ChartCard title="Tren Pertumbuhan" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									dataKey="date"
									tickFormatter={fmt}
									className="text-xs text-muted-foreground"
								/>
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px',
									}}
								/>
								<Area
									type="monotone"
									dataKey="newCustomers"
									stroke="#6366f1"
									fill="#6366f1"
									fillOpacity={0.15}
									name="Baru"
								/>
								<Area
									type="monotone"
									dataKey="totalCustomers"
									stroke="#10b981"
									fill="#10b981"
									fillOpacity={0.15}
									name="Kumulatif"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
