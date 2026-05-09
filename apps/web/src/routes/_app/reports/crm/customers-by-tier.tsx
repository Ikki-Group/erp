import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { UsersIcon, CrownIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'

import { crmReportApi } from '@/features/reporting/api'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export const Route = createFileRoute('/_app/reports/crm/customers-by-tier')({
	component: RouteComponent,
})

function RouteComponent() {
	const [dateRange, setDateRange] = useState({
		dateFrom: new Date(Date.now() - 30 * 86400000),
		dateTo: new Date(),
	})
	const { data, isLoading } = useQuery(crmReportApi.customersByTier.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Pelanggan per Tier"
				description="Distribusi pelanggan berdasarkan tier loyalitas."
			/>
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat title="Total Pelanggan" value={summary?.total ?? '0'} icon={UsersIcon} />
					<CardStat title="Tier Terbanyak" value={chartData[0]?.tierName ?? '-'} icon={CrownIcon} />
					<CardStat title="Jumlah Tier" value={String(summary?.count ?? 0)} icon={UsersIcon} />
				</div>
				<ChartCard title="Distribusi Tier Pelanggan" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={chartData}
									dataKey="count"
									nameKey="tier"
									cx="50%"
									cy="50%"
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
