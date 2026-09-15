import { createFileRoute } from '@tanstack/react-router'

import {
	AlertTriangleIcon,
	ArrowRightIcon,
	BoxesIcon,
	ClockIcon,
	ShoppingCartIcon,
	WalletIcon,
} from 'lucide-react'

import { AreaChart } from '@/components/charts/area-chart'
import { BarChart } from '@/components/charts/bar-chart'

import {
	DataCard,
	PageHeader,
	SegmentedBar,
	StatCard,
	StatusBadge,
} from '@/components/shared'

import { Button } from '@/components/ui/button'
import type { ChartConfig } from '@/components/ui/chart'

import { useAuth } from '@/providers/auth-provider.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/')({
	component: DashboardPage,
})

// ─── Static overview data ───
// Dashboard has no backing query yet (see docs/web ADR TODO) — this is
// illustrative content for the design pass, not a real metrics feed.

const revenueData = [
	{ day: 'Sen', revenue: 4200000 },
	{ day: 'Sel', revenue: 5100000 },
	{ day: 'Rab', revenue: 4800000 },
	{ day: 'Kam', revenue: 6200000 },
	{ day: 'Jum', revenue: 7400000 },
	{ day: 'Sab', revenue: 8900000 },
	{ day: 'Min', revenue: 7100000 },
]

const revenueChartConfig: ChartConfig = {
	revenue: { label: 'Revenue', color: 'var(--primary)' },
}

const categorySalesData = [
	{ category: 'Coffee', sales: 182 },
	{ category: 'Tea', sales: 94 },
	{ category: 'Pastry', sales: 61 },
	{ category: 'Snack', sales: 38 },
]

const categoryChartConfig: ChartConfig = {
	sales: { label: 'Terjual', color: 'var(--accent-warm)' },
}

const lowStockItems = [
	{ code: 'MAT-006', name: 'Vanilla Extract', stock: 2, unit: 'L', min: 5 },
	{ code: 'MAT-008', name: 'Matcha Powder', stock: 3, unit: 'kg', min: 5 },
	{ code: 'MAT-005', name: 'Chocolate Syrup', stock: 8, unit: 'L', min: 10 },
]

const recentActivity = [
	{ label: 'Order #ORD-0231 selesai', location: 'Kemang', time: '2 menit lalu', variant: 'success' as const },
	{ label: 'Penerimaan barang PO-0089 dikonfirmasi', location: 'Gudang Pusat', time: '18 menit lalu', variant: 'info' as const },
	{ label: 'Shift kasir dibuka', location: 'BSD', time: '41 menit lalu', variant: 'default' as const },
	{ label: 'Stock opname OPN-0012 selesai', location: 'Kemang', time: '1 jam lalu', variant: 'success' as const },
]

function DashboardPage() {
	const { user } = useAuth()
	const { activeLocation, isConsolidated } = useLocationContext()

	const scopeLabel = isConsolidated ? 'Semua lokasi' : activeLocation?.name ?? 'Semua lokasi'

	return (
		<div className="space-y-6">
			<PageHeader
				title={`Selamat datang, ${user?.name?.split(' ')[0] ?? 'kembali'}`}
				description={`Ringkasan operasional — ${scopeLabel}.`}
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Pendapatan Hari Ini"
					value="Rp 7.1M"
					icon={<WalletIcon className="size-4" />}
					trend={{ value: '+12.4%', positive: true }}
					description="vs. kemarin"
				/>
				<StatCard
					title="Order"
					value="128"
					icon={<ShoppingCartIcon className="size-4" />}
					trend={{ value: '+8', positive: true }}
					description="Hari ini"
				/>
				<StatCard
					title="Stok Menipis"
					value={lowStockItems.length}
					icon={<AlertTriangleIcon className="size-4" />}
					trend={{ value: '+1', positive: false }}
					description="Perlu restock"
				/>
				<StatCard
					title="Shift Aktif"
					value="2"
					icon={<ClockIcon className="size-4" />}
					description="Kasir sedang bertugas"
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<DataCard
					title="Revenue 7 Hari Terakhir"
					description="Total pendapatan harian."
					className="lg:col-span-2"
				>
					<AreaChart
						data={revenueData}
						config={revenueChartConfig}
						xAxisKey="day"
						dataKeys={['revenue']}
					/>
				</DataCard>

				<DataCard title="Stok Menipis" description="Perlu perhatian segera." noPadding>
					<div className="divide-y">
						{lowStockItems.map((item) => (
							<div key={item.code} className="flex items-center justify-between gap-3 px-4 py-3">
								<div className="space-y-0.5">
									<p className="text-sm font-medium">{item.name}</p>
									<p className="text-xs text-muted-foreground">{item.code}</p>
								</div>
								<StatusBadge variant="warning">
									{item.stock} {item.unit}
								</StatusBadge>
							</div>
						))}
					</div>
					<div className="border-t px-4 py-3">
						<Button variant="ghost" size="sm" className="w-full justify-between">
							Lihat semua stok
							<ArrowRightIcon className="size-3.5" />
						</Button>
					</div>
				</DataCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<DataCard
					title="Penjualan per Kategori"
					description="Jumlah item terjual minggu ini."
					className="lg:col-span-2"
				>
					<BarChart
						data={categorySalesData}
						config={categoryChartConfig}
						xAxisKey="category"
						dataKeys={['sales']}
					/>
				</DataCard>

				<DataCard title="Aktivitas Terbaru" noPadding>
					<div className="divide-y">
						{recentActivity.map((activity) => (
							<div key={activity.label} className="flex items-start gap-3 px-4 py-3">
								<BoxesIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
								<div className="min-w-0 flex-1 space-y-0.5">
									<p className="text-xs font-medium">{activity.label}</p>
									<p className="text-xs text-muted-foreground">
										{activity.location} · {activity.time}
									</p>
								</div>
							</div>
						))}
					</div>
				</DataCard>
			</div>

			<DataCard title="Status Order Hari Ini" description="Distribusi status order.">
				<SegmentedBar
					items={[
						{ label: 'Selesai', value: 108, className: 'bg-success' },
						{ label: 'Berjalan', value: 14, className: 'bg-info' },
						{ label: 'Void', value: 6, className: 'bg-destructive' },
					]}
				/>
			</DataCard>
		</div>
	)
}
