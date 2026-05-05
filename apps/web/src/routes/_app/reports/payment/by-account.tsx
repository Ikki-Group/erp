import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCardIcon, TrendingUpIcon, HashIcon } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'
import { paymentReportApi } from '@/features/reporting/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function PaymentByAccountRoute() {
	const [dateRange, setDateRange] = useState({ dateFrom: new Date(Date.now() - 30 * 86400000), dateTo: new Date() })
	const { data, isLoading } = useQuery(paymentReportApi.byAccount.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary

	return (
		<Page size="xl">
			<Page.BlockHeader title="Pembayaran per Akun" description="Distribusi pembayaran per akun ledger." />
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat title="Total Pembayaran" value={summary?.total ?? '0'} icon={CreditCardIcon} />
					<CardStat title="Rata-rata" value={summary?.average ?? '0'} icon={TrendingUpIcon} />
					<CardStat title="Jumlah Akun" value={String(summary?.count ?? 0)} icon={HashIcon} />
				</div>
				<ChartCard title="Pembayaran per Akun" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="accountName" className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
								<Legend />
								<Bar dataKey="totalAmount" fill="#6366f1" name="Total Amount" />
								<Bar dataKey="count" fill="#10b981" name="Count" />
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
