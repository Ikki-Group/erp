import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { AlertCircleIcon, DollarSignIcon, PackageIcon, TrendingUpIcon } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

import { CardStat } from '@/components/blocks/card/card-stat'
import { ChartCard, ChartGrid } from '@/components/blocks/data-display/chart-card'
import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { analyticsApi } from '@/features/dashboard'
import type { PnLDataDto, TopSalesItemDto } from '@/features/dashboard'
import { stockAlertApi, stockDashboardApi } from '@/features/inventory'
import type { StockAlertSelectDto } from '@/features/inventory'

export const Route = createFileRoute('/_app/')({ component: Dashboard })

const productConfig = { totalRevenue: { label: 'Pendapatan', color: 'oklch(var(--primary))' } }

function Dashboard() {
	const now = new Date()
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

	const { data: pnlData } = useQuery({
		queryKey: ['dashboard', 'pnl', startOfMonth.toISOString(), now.toISOString()],
		queryFn: () => analyticsApi.pnl.fetch({ body: { startDate: startOfMonth, endDate: now } }),
	})

	const { data: topSalesData } = useQuery({
		queryKey: ['dashboard', 'topSales', startOfMonth.toISOString(), now.toISOString()],
		queryFn: () =>
			analyticsApi.topSales.fetch({ body: { startDate: startOfMonth, endDate: now, limit: 5 } }),
	})

	const { data: kpiData } = useQuery(stockDashboardApi.kpi.query({}))

	const { data: alertData } = useQuery(stockAlertApi.list.query({ page: 1, limit: 5, type: 'all' }))

	const pnl: PnLDataDto | undefined = pnlData?.data
	const kpi = kpiData?.data
	const topSales: TopSalesItemDto[] = topSalesData?.data ?? []
	const alerts: StockAlertSelectDto[] = alertData?.data ?? []

	const revenue = Number(pnl?.revenue ?? 0)
	const cogs = Number(pnl?.cogs ?? 0)
	const grossMargin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0
	const lowStockCount = kpi?.lowStockCount ?? 0

	return (
		<Page>
			<Page.BlockHeader
				title="Dashboard Utama"
				description="Pantau performa bisnis real-time dari seluruh outlet Ikki Group."
			/>

			<Page.Content className="mt-2 space-y-8">
				{/* KPI Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<CardStat
						title="Pendapatan (Bulan Ini)"
						value={`Rp ${revenue.toLocaleString('id-ID')}`}
						description="Total pendapatan bulan berjalan"
						icon={DollarSignIcon}
					/>
					<CardStat
						title="Total HPP (COGS)"
						value={`Rp ${cogs.toLocaleString('id-ID')}`}
						description={`${grossMargin.toFixed(1)}% Gross Margin`}
						icon={PackageIcon}
					/>
					<CardStat
						title="Laba Bersih"
						value={`Rp ${Number(pnl?.netProfit ?? 0).toLocaleString('id-ID')}`}
						description="Laba setelah biaya operasional"
						icon={TrendingUpIcon}
					/>
					<CardStat
						title="Stok Menipis"
						value={`${lowStockCount} Item`}
						description="Butuh restock"
						icon={AlertCircleIcon}
					/>
				</div>

				{/* Charts Section */}
				<ChartGrid className="grid-cols-1 lg:grid-cols-3">
					<ChartCard
						className="lg:col-span-2"
						title="Produk Terlaris (Bulan Ini)"
						description="Berdasarkan total pendapatan"
					>
						<ChartContainer config={productConfig} className="aspect-auto h-87.5 w-full">
							<BarChart data={topSales} layout="vertical" margin={{ left: -20 }}>
								<XAxis type="number" hide />
								<YAxis
									dataKey="itemName"
									type="category"
									tickLine={false}
									axisLine={false}
									fontSize={12}
									width={140}
								/>
								<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
								<Bar dataKey="totalRevenue" fill="oklch(var(--primary))" radius={4} />
							</BarChart>
						</ChartContainer>
					</ChartCard>

					<ChartCard title="Ringkasan P&L" description="Periode bulan berjalan">
						<div className="flex flex-col gap-4 p-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Pendapatan</span>
								<span className="font-mono font-medium">Rp {revenue.toLocaleString('id-ID')}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">HPP (COGS)</span>
								<span className="font-mono font-medium text-rose-600">
									- Rp {cogs.toLocaleString('id-ID')}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Biaya Operasional</span>
								<span className="font-mono font-medium text-rose-600">
									- Rp {Number(pnl?.operatingExpenses ?? 0).toLocaleString('id-ID')}
								</span>
							</div>
							<hr className="border-dashed" />
							<div className="flex items-center justify-between">
								<span className="text-sm font-semibold">Laba Bersih</span>
								<span
									className={`font-mono font-bold ${Number(pnl?.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
								>
									Rp {Number(pnl?.netProfit ?? 0).toLocaleString('id-ID')}
								</span>
							</div>
						</div>
					</ChartCard>
				</ChartGrid>

				{/* Low Stock Alerts */}
				{alerts.length > 0 && (
					<div className="rounded-xl border bg-card text-card-foreground shadow-card">
						<div className="p-6 pb-3 flex items-center justify-between">
							<h3 className="font-semibold leading-none tracking-tight">Peringatan Stok Rendah</h3>
							<Button variant="ghost" size="sm" className="text-xs">
								Lihat Semua
							</Button>
						</div>
						<div className="px-6 pb-6">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Material</TableHead>
										<TableHead>Lokasi</TableHead>
										<TableHead className="text-right">Stok</TableHead>
										<TableHead className="text-right">Minimum</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{alerts.map((row) => (
										<TableRow key={`${row.materialId}-${row.locationId}`}>
											<TableCell className="font-medium">{row.materialName}</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{row.locationName}
											</TableCell>
											<TableCell className="text-right text-destructive font-semibold">
												{Number(row.currentQty).toLocaleString('id-ID')} {row.uomCode ?? ''}
											</TableCell>
											<TableCell className="text-right text-muted-foreground text-xs">
												{Number(row.minStock).toLocaleString('id-ID')} {row.uomCode ?? ''}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				)}
			</Page.Content>
		</Page>
	)
}
