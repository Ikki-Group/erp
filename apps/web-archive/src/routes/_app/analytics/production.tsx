import { useQuery } from '@tanstack/react-query'

import { PackageIcon, PackageCheckIcon, TimerIcon, TrendingUpIcon } from 'lucide-react'
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

import { workOrderApi } from '@/features/production/api'

export default function ProductionAnalyticsRoute() {
	const { data: woData, isLoading } = useQuery(workOrderApi.list.query({ page: 1, limit: 500 }))
	const wos = woData?.data ?? []

	const completed = wos.filter((w: any) => w.status === 'completed')
	const inProgress = wos.filter((w: any) => w.status === 'in_progress')
	// Planned work orders available for future use
	wos.filter((w: any) => w.status === 'planned')

	const totalProduced = completed.reduce((s: number, w: any) => s + Number(w.actualQty ?? 0), 0)
	const totalPlanned = wos.reduce((s: number, w: any) => s + Number(w.plannedQty ?? 0), 0)
	const efficiency = totalPlanned > 0 ? Math.round((totalProduced / totalPlanned) * 100) : 0

	const byProduct: Record<string, { name: string; planned: number; actual: number }> = {}
	for (const w of wos) {
		const productName = (w as any).productName
		if (!byProduct[productName])
			byProduct[productName] = { name: productName, planned: 0, actual: 0 }
		byProduct[productName]!.planned += Number((w as any).plannedQty ?? 0)
		byProduct[productName]!.actual += Number((w as any).actualQty ?? 0)
	}
	const chartData = Object.values(byProduct).slice(0, 10)

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Analitik Produksi"
				description="Ringkasan work order dan efisiensi produksi."
			/>
			<Page.Content className="flex flex-col gap-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<CardStat
						title="Work Order Selesai"
						value={String(completed.length)}
						icon={PackageCheckIcon}
					/>
					<CardStat title="Unit Diproduksi" value={String(totalProduced)} icon={PackageIcon} />
					<CardStat title="Efisiensi" value={`${efficiency}%`} icon={TrendingUpIcon} />
					<CardStat title="Dalam Proses" value={String(inProgress.length)} icon={TimerIcon} />
				</div>
				<ChartCard title="Target vs Aktual per Produk">
					<ChartContainer>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="name" className="text-xs text-muted-foreground" />
								<YAxis className="text-xs text-muted-foreground" />
								<Tooltip
									contentStyle={{
										backgroundColor: 'hsl(var(--card))',
										border: '1px solid hsl(var(--border))',
										borderRadius: '8px',
									}}
								/>
								<Legend />
								<Bar dataKey="planned" fill="#6366f1" name="Target" />
								<Bar dataKey="actual" fill="#10b981" name="Aktual" />
							</BarChart>
						</ResponsiveContainer>
					</ChartContainer>
				</ChartCard>
			</Page.Content>
		</Page>
	)
}
