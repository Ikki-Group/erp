import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { UsersIcon, DollarSignIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'

import { crmReportApi } from '@/features/reporting/api'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function TopCustomersReportRoute() {
	const [dateRange, setDateRange] = useState({
		dateFrom: new Date(Date.now() - 30 * 86400000),
		dateTo: new Date(),
	})
	const { data, isLoading } = useQuery(crmReportApi.topCustomers.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Top Pelanggan"
				description="10 pelanggan dengan pembelian terbesar."
			/>
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat
						title="Total Pembelian Top 10"
						value={summary?.total ?? '0'}
						icon={DollarSignIcon}
					/>
					<CardStat
						title="Rata-rata per Pelanggan"
						value={summary?.average ?? '0'}
						icon={DollarSignIcon}
					/>
					<CardStat title="Jumlah Pelanggan" value={String(summary?.count ?? 0)} icon={UsersIcon} />
				</div>
				<ChartCard title="Top Pelanggan" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={chartData}
									dataKey="totalSpent"
									nameKey="name"
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={120}
									label
								>
									{chartData.map((_, i) => (
										<Cell key={i} fill={COLORS[i % COLORS.length]} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px',
									}}
								/>
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
