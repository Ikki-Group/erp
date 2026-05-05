import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCardIcon, TrendingUpIcon, TrendingDownIcon, HashIcon } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'
import { paymentReportApi } from '@/features/reporting/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function PaymentOverTimeRoute() {
	const [dateRange, setDateRange] = useState({ dateFrom: new Date(Date.now() - 30 * 86400000), dateTo: new Date() })
	const { data, isLoading } = useQuery(paymentReportApi.overTime.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	const fmt = (d: Date | string) => (typeof d === 'string' ? new Date(d) : d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
	const totalPayable = chartData.reduce((s, d) => s + Number(d.payableAmount), 0)
	const totalReceivable = chartData.reduce((s, d) => s + Number(d.receivableAmount), 0)

	return (
		<Page size="xl">
			<Page.BlockHeader title="Pembayaran Over Time" description="Tren pembayaran dari waktu ke waktu." />
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat title="Total Payable" value={String(totalPayable)} icon={TrendingDownIcon} />
					<CardStat title="Total Receivable" value={String(totalReceivable)} icon={TrendingUpIcon} />
					<CardStat title="Jumlah Periode" value={String(summary?.count ?? 0)} icon={HashIcon} />
				</div>
				<ChartCard title="Tren Pembayaran" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="date" tickFormatter={fmt} className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
								<Legend />
								<Area type="monotone" dataKey="payableAmount" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Payable" />
								<Area type="monotone" dataKey="receivableAmount" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Receivable" />
							</AreaChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
