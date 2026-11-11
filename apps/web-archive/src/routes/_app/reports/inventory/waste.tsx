import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { Trash2Icon, TrendingUpIcon, HashIcon } from 'lucide-react'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from 'recharts'

import { Page } from '@/components/layout/page'
import { CardStat } from '@/components/reui/card-stat'
import { ChartCard } from '@/components/reui/chart-card'
import { ChartContainer } from '@/components/reui/chart-container'
import { ReportDateFilter } from '@/components/reui/report-date-filter'

import { inventoryReportApi } from '@/features/reporting/api'

export const Route = createFileRoute('/_app/reports/inventory/waste')({
	component: RouteComponent,
})

function RouteComponent() {
	const [dateRange, setDateRange] = useState({
		dateFrom: new Date(Date.now() - 30 * 86400000),
		dateTo: new Date(),
	})
	const { data, isLoading } = useQuery(inventoryReportApi.waste.query(dateRange))
	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary
	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Waste / Sisa Produksi"
				description="Analisis material terbuang atau rusak."
			/>
			<Page.Content className="flex flex-col gap-6">
				<ReportDateFilter {...dateRange} onChange={setDateRange} />
				<div className="grid gap-4 md:grid-cols-3">
					<CardStat title="Total Waste" value={summary?.total ?? '0'} icon={Trash2Icon} />
					<CardStat title="Rata-rata" value={summary?.average ?? '0'} icon={TrendingUpIcon} />
					<CardStat title="Jumlah Material" value={String(summary?.count ?? 0)} icon={HashIcon} />
				</div>
				<ChartCard title="Waste per Material" isLoading={isLoading}>
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData.slice(0, 20)}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="materialName" className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px',
									}}
								/>
								<Legend />
								<Bar dataKey="quantity" fill="#ef4444" name="Qty" />
								<Bar dataKey="cost" fill="#f59e0b" name="Biaya" />
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
