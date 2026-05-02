import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { ChartCard } from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import { Card } from '@/components/ui/card'

import { inventoryReportApi } from '@/features/reporting'
import type { InventoryReportRequestDto } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/inventory/movements')({
	component: InventoryMovementsReport,
})

const chartConfig = {
	quantityIn: { label: 'Masuk', color: 'oklch(var(--chart-2))' },
	quantityOut: { label: 'Keluar', color: 'oklch(var(--chart-1))' },
	netMovement: { label: 'Bersih', color: 'oklch(var(--primary))' },
}

function InventoryMovementsReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data } = useQuery(
		inventoryReportApi.movements.query(filter as InventoryReportRequestDto),
	)

	const chartData = data?.data?.data ?? []

	return (
		<Page>
			<Page.BlockHeader
				title="Pergerakan Stok"
				description="Analisis pergerakan stok masuk dan keluar berdasarkan periode."
			/>
			<Page.Content className="space-y-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} />
					</Card.Content>
				</Card>

				<ChartCard title="Tren Pergerakan" description="Grafik stok masuk, keluar, dan bersih">
					<ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
						<AreaChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
							<CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(v) => new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
							/>
							<YAxis hide />
							<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
							<Area dataKey="quantityIn" type="monotone" stroke="oklch(var(--chart-2))" fill="transparent" strokeWidth={2} />
							<Area dataKey="quantityOut" type="monotone" stroke="oklch(var(--chart-1))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
							<Area dataKey="netMovement" type="monotone" stroke="oklch(var(--primary))" fill="transparent" strokeWidth={2} />
							<ChartLegend content={<ChartLegendContent />} />
						</AreaChart>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
