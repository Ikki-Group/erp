import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import {
	AlertTriangleIcon,
	ArrowRightIcon,
	BoxesIcon,
	ClockIcon,
	ShoppingCartIcon,
} from 'lucide-react'

import { DataCard, EmptyState, PageHeader, StatCard, StatusBadge } from '@/components/shared'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { auditResource } from '@/features/audit/api.ts'
import { stockBalanceList } from '@/features/inventory/api.ts'
import { orderResource, shiftResource } from '@/features/pos/api.ts'

import { useAuth } from '@/providers/auth-provider.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/')({
	component: DashboardPage,
})

/** Local-day [start, end] as ISO strings, for "today" list filters. */
function todayRange(): { dateFrom: string; dateTo: string } {
	const start = new Date()
	start.setHours(0, 0, 0, 0)
	const end = new Date()
	end.setHours(23, 59, 59, 999)
	return { dateFrom: start.toISOString(), dateTo: end.toISOString() }
}

function relativeTime(value: Date | string): string {
	const diffMs = Date.now() - new Date(value).getTime()
	const min = Math.round(diffMs / 60000)
	if (min < 1) return 'baru saja'
	if (min < 60) return `${min} menit lalu`
	const hours = Math.round(min / 60)
	if (hours < 24) return `${hours} jam lalu`
	return `${Math.round(hours / 24)} hari lalu`
}

function DashboardPage() {
	const { user } = useAuth()
	const { activeLocation, isConsolidated } = useLocationContext()
	const locationId = activeLocation?.id
	const scopeLabel = isConsolidated ? 'Semua lokasi' : (activeLocation?.name ?? 'Semua lokasi')

	// Computed once per mount — a fresh value each render would change the query
	// key every render and cause a refetch loop.
	// ponytail: "today" is fixed at mount; a midnight rollover mid-session shows
	// stale bounds until reload. Acceptable for a dashboard glance.
	const range = useMemo(() => todayRange(), [])

	// ─── Today's orders (count only — revenue is a server aggregation, see below) ───
	const ordersQuery = useQuery({
		...orderResource.list.queryOptions({
			page: 1,
			limit: 1,
			locationId: locationId!,
			...range,
		}),
		enabled: locationId !== undefined,
	})
	const todayOrders = ordersQuery.data?.meta?.total

	// ─── Active shifts (count of open shifts) ───
	const shiftsQuery = useQuery({
		...shiftResource.list.queryOptions({
			page: 1,
			limit: 1,
			status: 'open',
			locationId: locationId!,
		}),
		enabled: locationId !== undefined,
	})
	const activeShifts = shiftsQuery.data?.meta?.total

	// ─── Low stock (materials below their minimum at the active location) ───
	// ponytail: reads only the first 200 balances and filters client-side; a
	// location with >200 materials under-reports. Fine for a dashboard glance —
	// a server-side "low stock" count endpoint is the upgrade path.
	const stockQuery = useQuery({
		...stockBalanceList.queryOptions({ page: 1, limit: 200, locationId: locationId! }),
		enabled: locationId !== undefined,
	})
	const lowStockItems = (stockQuery.data?.data ?? []).filter(
		(b) => b.minStock !== null && Number(b.quantity) < Number(b.minStock),
	)

	// ─── Recent activity (audit log — works consolidated) ───
	const activityQuery = useQuery(auditResource.list.queryOptions({ page: 1, limit: 6 }))
	const recentActivity = activityQuery.data?.data ?? []

	return (
		<div className="space-y-6">
			<PageHeader
				title={`Selamat datang, ${user?.name?.split(' ')[0] ?? 'kembali'}`}
				description={`Ringkasan operasional — ${scopeLabel}.`}
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Order Hari Ini"
					value={isConsolidated ? '—' : (todayOrders ?? '…')}
					icon={<ShoppingCartIcon className="size-4" />}
					description={isConsolidated ? 'Pilih lokasi' : 'Order hari ini'}
				/>
				<StatCard
					title="Pendapatan Hari Ini"
					value="Segera"
					icon={<AlertTriangleIcon className="size-4" />}
					description="Butuh agregasi server"
				/>
				<StatCard
					title="Stok Menipis"
					value={isConsolidated ? '—' : stockQuery.isLoading ? '…' : lowStockItems.length}
					icon={<AlertTriangleIcon className="size-4" />}
					description={isConsolidated ? 'Pilih lokasi' : 'Di bawah minimum'}
				/>
				<StatCard
					title="Shift Aktif"
					value={isConsolidated ? '—' : (activeShifts ?? '…')}
					icon={<ClockIcon className="size-4" />}
					description={isConsolidated ? 'Pilih lokasi' : 'Kasir bertugas'}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<DataCard
					title="Tren Pendapatan"
					description="Pendapatan harian 7 hari terakhir."
					className="lg:col-span-2"
				>
					<EmptyState
						title="Segera hadir"
						description="Grafik tren pendapatan menunggu endpoint agregasi di server."
					/>
				</DataCard>

				<DataCard title="Stok Menipis" description="Perlu perhatian segera." noPadding>
					{isConsolidated ? (
						<div className="p-4">
							<EmptyState title="Pilih lokasi" description="Stok menipis dihitung per lokasi." />
						</div>
					) : stockQuery.isLoading ? (
						<div className="space-y-2 p-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : stockQuery.isError ? (
						<div className="p-4 text-xs text-destructive">Gagal memuat data stok.</div>
					) : lowStockItems.length === 0 ? (
						<div className="p-4">
							<EmptyState
								title="Semua stok aman"
								description="Tidak ada material di bawah minimum."
							/>
						</div>
					) : (
						<>
							<div className="divide-y">
								{lowStockItems.slice(0, 6).map((item) => (
									<div
										key={item.materialId}
										className="flex items-center justify-between gap-3 px-4 py-3"
									>
										<div className="space-y-0.5">
											<p className="text-sm font-medium">{item.materialName}</p>
											<p className="text-xs text-muted-foreground">{item.materialCode}</p>
										</div>
										<StatusBadge variant="warning">
											{Number(item.quantity)} {item.uomCode}
										</StatusBadge>
									</div>
								))}
							</div>
							<div className="border-t px-4 py-3">
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-between"
									render={<Link to="/inventory/stock" />}
								>
									Lihat semua stok
									<ArrowRightIcon className="size-3.5" />
								</Button>
							</div>
						</>
					)}
				</DataCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<DataCard
					title="Penjualan per Kategori"
					description="Jumlah item terjual."
					className="lg:col-span-2"
				>
					<EmptyState
						title="Segera hadir"
						description="Rincian penjualan per kategori menunggu endpoint agregasi di server."
					/>
				</DataCard>

				<DataCard title="Aktivitas Terbaru" noPadding>
					{activityQuery.isLoading ? (
						<div className="space-y-2 p-4">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</div>
					) : activityQuery.isError ? (
						<div className="p-4 text-xs text-destructive">Gagal memuat aktivitas.</div>
					) : recentActivity.length === 0 ? (
						<div className="p-4">
							<EmptyState
								title="Belum ada aktivitas"
								description="Aktivitas terbaru akan muncul di sini."
							/>
						</div>
					) : (
						<div className="divide-y">
							{recentActivity.map((activity) => (
								<div key={activity.id} className="flex items-start gap-3 px-4 py-3">
									<BoxesIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
									<div className="min-w-0 flex-1 space-y-0.5">
										<p className="text-xs font-medium">{activity.summary}</p>
										<p className="text-xs text-muted-foreground">
											{activity.userName} · {relativeTime(activity.timestamp)}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</DataCard>
			</div>
		</div>
	)
}
