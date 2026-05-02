import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ArrowDownIcon, ArrowUpIcon, DollarSignIcon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { CardStat } from '@/components/blocks/card/card-stat'
import { ChartCard } from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'

import { financeReportApi } from '@/features/reporting'
import type { FinanceReportRequestDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/finance/cash-flow')({
	component: FinanceCashFlowReport,
})

const chartConfig = {
	inflow: { label: 'Pemasukan', color: 'oklch(var(--chart-2))' },
	outflow: { label: 'Pengeluaran', color: 'oklch(var(--chart-1))' },
	net: { label: 'Bersih', color: 'oklch(var(--primary))' },
}

function FinanceCashFlowReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data } = useQuery(financeReportApi.cashFlow.query(filter as FinanceReportRequestDto))

	const chartData = data?.data?.data ?? []
	const summary = data?.data?.summary

	const totalInflow = chartData.reduce((sum, d) => sum + Number(d.inflow), 0)
	const totalOutflow = chartData.reduce((sum, d) => sum + Number(d.outflow), 0)
	const netCash = Number(summary?.total ?? 0)

	return (
		<Page>
			<Page.BlockHeader
				title="Arus Kas (Cash Flow)"
				description="Analisis aliran kas masuk dan keluar berdasarkan periode."
			/>
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} />
					</Card.Content>
				</Card>

				<div className="grid gap-4 md:grid-cols-3">
					<CardStat
						title="Total Pemasukan"
						value={`Rp ${totalInflow.toLocaleString('id-ID')}`}
						icon={ArrowUpIcon}
					/>
					<CardStat
						title="Total Pengeluaran"
						value={`Rp ${totalOutflow.toLocaleString('id-ID')}`}
						icon={ArrowDownIcon}
					/>
					<CardStat
						title="Arus Kas Bersih"
						value={`Rp ${netCash.toLocaleString('id-ID')}`}
						icon={DollarSignIcon}
					/>
				</div>

				<ChartCard title="Tren Arus Kas" description="Grafik pemasukan, pengeluaran, dan bersih">
					<ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
						<AreaChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(v) =>
									new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
								}
							/>
							<YAxis hide />
							<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
							<Area
								dataKey="inflow"
								type="monotone"
								stroke="oklch(var(--chart-2))"
								fill="transparent"
								strokeWidth={2}
							/>
							<Area
								dataKey="outflow"
								type="monotone"
								stroke="oklch(var(--chart-1))"
								fill="transparent"
								strokeWidth={2}
								strokeDasharray="5 5"
							/>
							<Area
								dataKey="net"
								type="monotone"
								stroke="oklch(var(--primary))"
								fill="transparent"
								strokeWidth={2}
							/>
							<ChartLegend content={<ChartLegendContent />} />
						</AreaChart>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
