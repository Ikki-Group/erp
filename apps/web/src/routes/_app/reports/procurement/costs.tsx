import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSignIcon, TrendingUpIcon, HashIcon } from 'lucide-react'
import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'
import { procurementReportApi } from '@/features/reporting/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ProcurementCostsReportRoute() {
	const [dateRange, setDateRange] = useState({ dateFrom: new Date(Date.now() - 30 * 86400000), dateTo: new Date() })
	const { data, isLoading } = useQuery(procurementReportApi.costs.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	return (
		<Page size="xl">
			<Page.BlockHeader title="Tren Harga Material" description="Analisis tren harga pembelian material." />
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat title="Total Cost" value={summary?.total ?? '0'} icon={DollarSignIcon} />
					<CardStat title="Rata-rata" value={summary?.average ?? '0'} icon={TrendingUpIcon} />
					<CardStat title="Jumlah Transaksi" value={String(summary?.count ?? 0)} icon={HashIcon} />
				</div>
				<ChartCard title="Harga Unit per Material" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={chartData.slice(0, 50)}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="materialName" className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
								<Legend />
								<Line type="monotone" dataKey="unitPrice" stroke="#6366f1" name="Unit Price" />
							</LineChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
