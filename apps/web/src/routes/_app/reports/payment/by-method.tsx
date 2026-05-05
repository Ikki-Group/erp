import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCardIcon, TrendingUpIcon, HashIcon } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'
import { paymentReportApi } from '@/features/reporting/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function PaymentByMethodRoute() {
	const [dateRange, setDateRange] = useState({ dateFrom: new Date(Date.now() - 30 * 86400000), dateTo: new Date() })
	const { data, isLoading } = useQuery(paymentReportApi.byMethod.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary

	return (
		<Page size="xl">
			<Page.BlockHeader title="Pembayaran per Metode" description="Distribusi pembayaran berdasarkan metode." />
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat title="Total Pembayaran" value={summary?.total ?? '0'} icon={CreditCardIcon} />
					<CardStat title="Rata-rata" value={summary?.average ?? '0'} icon={TrendingUpIcon} />
					<CardStat title="Jumlah Transaksi" value={String(summary?.count ?? 0)} icon={HashIcon} />
				</div>
				<ChartCard title="Distribusi Metode Pembayaran" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									innerRadius={80}
									outerRadius={140}
									paddingAngle={4}
									dataKey="totalAmount"
									nameKey="method"
								>
									{chartData.map((_, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
