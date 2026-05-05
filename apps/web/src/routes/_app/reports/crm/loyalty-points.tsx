import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { AwardIcon, UsersIcon, GiftIcon } from 'lucide-react'
import {
	BarChart,
	Bar,
	ResponsiveContainer,
	Tooltip,
	CartesianGrid,
	XAxis,
	YAxis,
	Legend,
} from 'recharts'

import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'

import { crmReportApi } from '@/features/reporting/api'

export default function LoyaltyPointsReportRoute() {
	const [dateRange, setDateRange] = useState({
		dateFrom: new Date(Date.now() - 30 * 86400000),
		dateTo: new Date(),
	})
	const { data, isLoading } = useQuery(crmReportApi.loyaltyPoints.query(dateRange))
	const chartData = (data?.data?.data ?? []) as any[]
	const summary = data?.data
	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Poin Loyalty"
				description="Ringkasan poin loyalty yang diterbitkan dan diredeem."
			/>
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat
						title="Total Poin Terbit"
						value={summary?.data?.totalPointsIssued ?? '0'}
						icon={AwardIcon}
					/>
					<CardStat
						title="Total Poin Redeem"
						value={summary?.data?.totalPointsRedeemed ?? '0'}
						icon={GiftIcon}
					/>
					<CardStat
						title="Saldo Poin"
						value={summary?.data?.pointsBalance ?? '0'}
						icon={UsersIcon}
					/>
				</div>
				<ChartCard title="Aktivitas Poin" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="date" className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px',
									}}
								/>
								<Legend />
								<Bar dataKey="issued" fill="#6366f1" name="Diterbitkan" />
								<Bar dataKey="redeemed" fill="#10b981" name="Diredeem" />
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
