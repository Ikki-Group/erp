import { createFileRoute } from '@tanstack/react-router'
import { CheckCircleIcon, ClockIcon, FactoryIcon, SettingsIcon, TrendingUpIcon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { CardStat } from '@/components/blocks/card/card-stat'
import {
	ChartCard,
	ChartFooterContent,
	ChartGrid,
} from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'

export const Route = createFileRoute('/_app/analytics/production')({
	component: AnalyticsProductionPage,
})

// Mock Data
const productionEfficiencyData = [
	{ week: 'W1', target: 5000, actual: 4800 },
	{ week: 'W2', target: 5500, actual: 5600 },
	{ week: 'W3', target: 5500, actual: 5100 },
	{ week: 'W4', target: 6000, actual: 6100 },
	{ week: 'W5', target: 6500, actual: 6400 },
]

const efficiencyConfig = {
	actual: { label: 'Realisasi Produksi', color: 'hsl(var(--chart-1))' },
	target: { label: 'Target Produksi', color: 'hsl(var(--muted-foreground))' },
}

const rejectReasonData = [
	{ reason: 'Cacat Mesin', count: 120 },
	{ reason: 'Bahan Rusak', count: 85 },
	{ reason: 'Human Error', count: 45 },
	{ reason: 'Kalibrasi Berubah', count: 30 },
]

const rejectConfig = {
	count: { label: 'Kejadian', color: 'hsl(var(--chart-5))' },
	reason: { label: 'Alasan' },
}

function AnalyticsProductionPage() {
	return (
		<Page>
			<Page.BlockHeader
				title="Laporan Produksi"
				description="Analisis realisasi target, rasio kecacatan, dan efektivitas proses produksi (OEE)."
			/>

			<Page.Content className="mt-2">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
					<CardStat title="Total Unit Diproduksi" value="28,000" icon={FactoryIcon} />
					<CardStat title="Rata-rata OEE" value="89.4%" icon={SettingsIcon} />
					<CardStat title="Waktu Downtime (Jam)" value="12.5" icon={ClockIcon} />
					<CardStat title="WO Selesai" value="145" icon={CheckCircleIcon} />
				</div>

				<ChartGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
					<ChartCard
						className="lg:col-span-3"
						title="Realisasi Produksi Mingguan"
						description="Perbandingan target vs realisasi selama 5 minggu terakhir"
						footer={
							<ChartFooterContent
								trend="up"
								trendValue="Realisasi mencapai rata-rata 97.4%"
								trendIcon={<TrendingUpIcon className="h-4 w-4" />}
								description="Berdasarkan jadwal Work Order aktif"
							/>
						}
					>
						<ChartContainer config={efficiencyConfig}>
							<BarChart data={productionEfficiencyData}>
								<CartesianGrid vertical={false} />
								<XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
								<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
								<ChartLegend content={<ChartLegendContent />} />
								<Bar
									dataKey="target"
									fill="var(--color-target)"
									radius={[4, 4, 0, 0]}
									opacity={0.3}
								/>
								<Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ChartContainer>
					</ChartCard>

					<ChartCard
						className="lg:col-span-2"
						title="Analisis Defect / Reject"
						description="Kategori penyebab barang reject"
						footer={
							<ChartFooterContent
								trend="down"
								trendValue="Total defect turun 8% dari bulan lalu"
								description="Angka reject masih dibawah margin wajar 2%"
							/>
						}
					>
						<ChartContainer config={rejectConfig}>
							<BarChart data={rejectReasonData} layout="vertical">
								<CartesianGrid horizontal={false} />
								<YAxis
									dataKey="reason"
									type="category"
									tickLine={false}
									tickMargin={10}
									axisLine={false}
									width={110}
								/>
								<XAxis dataKey="count" type="number" hide />
								<ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
								<Bar dataKey="count" fill="var(--color-count)" radius={4} />
							</BarChart>
						</ChartContainer>
					</ChartCard>
				</ChartGrid>
			</Page.Content>
		</Page>
	)
}
