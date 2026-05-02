import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'

import { ChartCard, ChartGrid } from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from '@/components/ui/chart'
import { Card } from '@/components/ui/card'

import { salesReportApi } from '@/features/reporting'
import type { SalesReportRequestDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/sales/channels')({
	component: SalesChannelsReport,
})

const COLORS = [
	'oklch(var(--chart-1))',
	'oklch(var(--chart-2))',
	'oklch(var(--chart-3))',
	'oklch(var(--chart-4))',
	'oklch(var(--chart-5))',
]

const locationConfig = { revenue: { label: 'Pendapatan', color: 'oklch(var(--primary))' } }
const typeConfig = { revenue: { label: 'Pendapatan', color: 'oklch(var(--chart-1))' } }

function SalesChannelsReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data: locationData } = useQuery(
		salesReportApi.byLocation.query(filter as SalesReportRequestDto),
	)

	const { data: typeData } = useQuery(
		salesReportApi.byType.query(filter as SalesReportRequestDto),
	)

	const byLocation = locationData?.data?.data ?? []
	const byType = typeData?.data?.data ?? []

	return (
		<Page>
			<Page.BlockHeader
				title="Channel Penjualan"
				description="Distribusi penjualan per lokasi dan tipe penjualan."
			/>
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} showGroupBy={false} />
					</Card.Content>
				</Card>

				<ChartGrid className="grid-cols-1 lg:grid-cols-2">
					<ChartCard title="Penjualan per Lokasi" description="Distribusi pendapatan per outlet">
						<ChartContainer config={locationConfig} className="aspect-auto h-80 w-full">
							<BarChart data={byLocation} margin={{ left: -20 }}>
								<XAxis
									dataKey="locationName"
									tickLine={false}
									axisLine={false}
									fontSize={12}
								/>
								<YAxis hide />
								<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
								<Bar dataKey="revenue" fill="oklch(var(--primary))" radius={4} />
							</BarChart>
						</ChartContainer>
					</ChartCard>

					<ChartCard title="Penjualan per Tipe" description="Distribusi per tipe (Dine-in, Take-away, dll)">
						<ChartContainer config={typeConfig} className="aspect-auto h-80 w-full">
							<PieChart>
								<ChartTooltip content={<ChartTooltipContent hideLabel />} />
								<Pie
									data={byType}
									dataKey="revenue"
									nameKey="salesTypeName"
									innerRadius={60}
									outerRadius={100}
								>
									{byType.map((_, i) => (
										<Cell key={i} fill={COLORS[i % COLORS.length]} />
									))}
								</Pie>
								<ChartLegend content={<ChartLegendContent nameKey="salesTypeName" />} />
							</PieChart>
						</ChartContainer>
					</ChartCard>
				</ChartGrid>
			</Page.Content>
		</Page>
	)
}
