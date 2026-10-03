import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	CalendarIcon,
	ClipboardListIcon,
	HistoryIcon,
	InboxIcon,
	TruckIcon,
} from 'lucide-react'

import {
	AuditTrail,
	DataCard,
	EmptyState,
	PageHeader,
	StatCard,
	StatusBadge,
} from '@/components/shared'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { auditResource } from '@/features/audit/api.ts'
import { opnameResource, receivingResource, stockBalanceList, transferResource } from '@/features/inventory/api.ts'
import { RECEIVING_STATUS_LABELS, TRANSFER_STATUS_LABELS } from '@/features/inventory/dto/index.ts'

import { useAuth } from '@/providers/auth-provider.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/')({
	component: DashboardPage,
})

function DashboardPage() {
	const { user } = useAuth()
	const { activeLocation, isConsolidated, locations } = useLocationContext()
	const locationId = activeLocation?.id
	const scopeLabel = isConsolidated ? 'Semua lokasi' : (activeLocation?.name ?? 'Semua lokasi')

	const locationNameById = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations])

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

	// ─── Transfers in transit (either direction) at the active location ───
	const transfersQuery = useQuery({
		...transferResource.list.queryOptions({
			page: 1,
			limit: 6,
			locationId: locationId!,
			status: 'in_transit',
		}),
		enabled: locationId !== undefined,
	})
	const inTransitTransfers = transfersQuery.data?.data ?? []
	const inTransitCount = transfersQuery.data?.meta?.total

	// ─── Active stock counts (opname in progress) at the active location ───
	const opnameQuery = useQuery({
		...opnameResource.list.queryOptions({
			page: 1,
			limit: 1,
			locationId: locationId!,
			status: 'in_progress',
		}),
		enabled: locationId !== undefined,
	})
	const activeOpnameCount = opnameQuery.data?.meta?.total

	// ─── Draft receivings awaiting confirmation at the active location ───
	const receivingQuery = useQuery({
		...receivingResource.list.queryOptions({
			page: 1,
			limit: 6,
			locationId: locationId!,
			status: 'draft',
		}),
		enabled: locationId !== undefined,
	})
	const draftReceivings = receivingQuery.data?.data ?? []
	const draftReceivingCount = receivingQuery.data?.meta?.total

	// ─── Recent activity (audit log — works consolidated) ───
	const activityQuery = useQuery(auditResource.list.queryOptions({ page: 1, limit: 6 }))
	const recentActivity = activityQuery.data?.data ?? []

	return (
		<div className="space-y-6">
			<PageHeader
				title={`Selamat datang, ${user?.name?.split(' ')[0] ?? 'kembali'}`}
				description={`Ringkasan operasional — ${scopeLabel}.`}
				actions={
					<div className="hidden items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground sm:flex">
						<CalendarIcon className="size-3.5" />
						{format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale })}
					</div>
				}
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Stok Menipis"
					value={isConsolidated ? '—' : lowStockItems.length}
					icon={<AlertTriangleIcon className="size-4" />}
					description={isConsolidated ? 'Pilih lokasi' : 'Di bawah minimum'}
					tone={!isConsolidated && lowStockItems.length > 0 ? 'warning' : 'default'}
					isLoading={!isConsolidated && stockQuery.isLoading}
				/>
				<StatCard
					title="Transfer Berjalan"
					value={isConsolidated ? '—' : (inTransitCount ?? 0)}
					icon={<TruckIcon className="size-4" />}
					description={isConsolidated ? 'Pilih lokasi' : 'Dalam perjalanan'}
					isLoading={!isConsolidated && transfersQuery.isLoading}
				/>
				<StatCard
					title="Opname Aktif"
					value={isConsolidated ? '—' : (activeOpnameCount ?? 0)}
					icon={<ClipboardListIcon className="size-4" />}
					description={isConsolidated ? 'Pilih lokasi' : 'Sedang berjalan'}
					isLoading={!isConsolidated && opnameQuery.isLoading}
				/>
				<StatCard
					title="Penerimaan Draft"
					value={isConsolidated ? '—' : (draftReceivingCount ?? 0)}
					icon={<InboxIcon className="size-4" />}
					description={isConsolidated ? 'Pilih lokasi' : 'Menunggu konfirmasi'}
					isLoading={!isConsolidated && receivingQuery.isLoading}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<DataCard
					title="Transfer Berjalan"
					description="Perpindahan stok antar lokasi yang sedang berjalan."
					icon={<TruckIcon className="size-4" />}
					tone="default"
					noPadding
					className="lg:col-span-2"
				>
					{isConsolidated ? (
						<div className="p-4">
							<EmptyState title="Pilih lokasi" description="Transfer dihitung per lokasi." />
						</div>
					) : transfersQuery.isLoading ? (
						<div className="space-y-2 p-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : transfersQuery.isError ? (
						<div className="p-4 text-xs text-destructive">Gagal memuat data transfer.</div>
					) : inTransitTransfers.length === 0 ? (
						<div className="p-4">
							<EmptyState
								title="Tidak ada transfer berjalan"
								description="Semua transfer sudah diterima."
							/>
						</div>
					) : (
						<>
							<div className="divide-y">
								{inTransitTransfers.map((t) => (
									<div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
										<div className="space-y-0.5">
											<p className="font-mono text-sm font-medium">{t.transferNo}</p>
											<p className="text-xs text-muted-foreground">
												{locationNameById.get(t.fromLocationId) ?? '—'}
												{' → '}
												{locationNameById.get(t.toLocationId) ?? '—'}
											</p>
										</div>
										<StatusBadge variant="warning">
											{TRANSFER_STATUS_LABELS[t.status]}
										</StatusBadge>
									</div>
								))}
							</div>
							<div className="border-t px-4 py-3">
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-between"
									render={<Link to="/inventory/transfers" />}
								>
									Lihat semua transfer
									<ArrowRightIcon className="size-3.5" />
								</Button>
							</div>
						</>
					)}
				</DataCard>

				<DataCard
					title="Stok Menipis"
					description="Perlu perhatian segera."
					icon={<AlertTriangleIcon className="size-4" />}
					tone={!isConsolidated && lowStockItems.length > 0 ? 'warning' : 'default'}
					noPadding
				>
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
											<p className="text-xs font-mono text-muted-foreground">{item.materialCode}</p>
										</div>
										<StatusBadge variant="warning">
											<span className="tabular-nums">{Number(item.quantity)}</span> {item.uomCode}
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
					title="Penerimaan Draft"
					description="Penerimaan barang yang menunggu konfirmasi."
					icon={<InboxIcon className="size-4" />}
					noPadding
					className="lg:col-span-2"
				>
					{isConsolidated ? (
						<div className="p-4">
							<EmptyState title="Pilih lokasi" description="Penerimaan dihitung per lokasi." />
						</div>
					) : receivingQuery.isLoading ? (
						<div className="space-y-2 p-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : receivingQuery.isError ? (
						<div className="p-4 text-xs text-destructive">Gagal memuat data penerimaan.</div>
					) : draftReceivings.length === 0 ? (
						<div className="p-4">
							<EmptyState
								title="Tidak ada penerimaan draft"
								description="Semua penerimaan sudah dikonfirmasi."
							/>
						</div>
					) : (
						<>
							<div className="divide-y">
								{draftReceivings.map((r) => (
									<div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
										<div className="space-y-0.5">
											<p className="font-mono text-sm font-medium">{r.receivingNo}</p>
											<p className="text-xs text-muted-foreground">
												{locationNameById.get(r.locationId) ?? '—'}
											</p>
										</div>
										<StatusBadge variant="warning">
											{RECEIVING_STATUS_LABELS[r.status]}
										</StatusBadge>
									</div>
								))}
							</div>
							<div className="border-t px-4 py-3">
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-between"
									render={<Link to="/inventory/receiving" />}
								>
									Lihat semua penerimaan
									<ArrowRightIcon className="size-3.5" />
								</Button>
							</div>
						</>
					)}
				</DataCard>

				<DataCard title="Aktivitas Terbaru" icon={<HistoryIcon className="size-4" />}>
					{activityQuery.isError ? (
						<p className="text-xs text-destructive">Gagal memuat aktivitas.</p>
					) : (
						<AuditTrail
							entries={recentActivity}
							isLoading={activityQuery.isLoading}
							emptyMessage="Aktivitas terbaru akan muncul di sini."
						/>
					)}
				</DataCard>
			</div>
		</div>
	)
}
