import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowLeftIcon, PackageIcon, PlusIcon, SendIcon, TruckIcon } from 'lucide-react'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { AuditTrail } from '@/components/shared/audit-trail'
import { confirm } from '@/components/shared/confirm'
import type { DateRange } from '@/components/shared/date-range-filter'
import { DetailList } from '@/components/shared/detail-list'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { PageSection } from '@/components/shared/page-section'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'
import type { StatusBadgeVariant } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { auditResource } from '@/features/audit/api.ts'
import { transferResource } from '@/features/inventory/api.ts'
import { TRANSFER_STATUS_LABELS, TransferStatusEnum } from '@/features/inventory/dto/index.ts'
import type { TransferDto } from '@/features/inventory/dto/index.ts'
import { materialResource } from '@/features/material/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

// No server-side text search on this endpoint — status filter + pagination only.
const transfersSearchSchema = listSearchSchema.omit({ q: true }).extend({
	status: TransferStatusEnum.optional(),
})

export const Route = createFileRoute('/_authenticated/inventory/transfers/')({
	validateSearch: transfersSearchSchema,
	component: TransfersPage,
})

// ─── Helpers ───

const STATUS_VARIANTS: Record<TransferStatusEnum, StatusBadgeVariant> = {
	requested: 'info',
	in_transit: 'warning',
	received: 'success',
	cancelled: 'destructive',
}

// ─── Table Column Helper ───

const col = createColumnHelper<DataGridFeatures, TransferDto>()

// ─── Page ───

function TransfersPage() {
	const { activeLocation, locations } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const locationId = activeLocation?.id
	const canCreate = usePermissionCheck({ permission: 'transfer.create' })
	const canShip = usePermissionCheck({ permission: 'transfer.ship' })
	const canReceive = usePermissionCheck({ permission: 'transfer.receive' })
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })

	const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null)
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

	const locationMap = useMemo(() => {
		const map = new Map<number, string>()
		for (const loc of locations) {
			map.set(loc.id, loc.name)
		}
		return map
	}, [locations])

	const listQuery = useQuery({
		...transferResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			status: search.status,
			locationId: locationId,
			dateFrom: dateRange?.from.toISOString(),
			dateTo: dateRange?.to.toISOString(),
		}),
		enabled: !!locationId,
	})

	const shipMut = useMutation(transferResource.ship.mutationOptions())
	const receiveMut = useMutation(transferResource.receive.mutationOptions())

	// Server filters by createdAt range (TransferFilterDto.dateFrom/dateTo), so
	// page + total count both honor the range — no client-side slicing.
	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	// ─── Lookup queries for detail view ───

	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
	const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

	const materialsMap = useMemo(() => {
		const map = new Map<number, string>()
		for (const m of materialsQuery.data?.data ?? []) {
			map.set(m.id, `${m.name} (${m.code})`)
		}
		return map
	}, [materialsQuery.data])

	const uomsMap = useMemo(() => {
		const map = new Map<number, string>()
		for (const u of uomsQuery.data?.data ?? []) {
			map.set(u.id, u.code)
		}
		return map
	}, [uomsQuery.data])

	// ─── Detail view queries ───

	const detailQuery = useQuery({
		...transferResource.detail.queryOptions({ id: selectedTransferId! }),
		enabled: !!selectedTransferId,
	})
	const detail = detailQuery.data?.data

	const auditQuery = useQuery({
		...auditResource.byEntity.queryOptions({
			entity: 'transfer_request',
			entityId: selectedTransferId!,
		}),
		enabled: !!selectedTransferId && canReadAudit,
	})

	// ─── Ship ───

	const handleShip = useCallback(
		async (transfer: TransferDto) => {
			await confirm({
				title: 'Kirim transfer?',
				description: `Transfer ${transfer.transferNo} akan ditandai sebagai "Dalam Perjalanan". Lanjutkan?`,
				confirmLabel: 'Kirim',
				onConfirm: async () => {
					await shipMut.mutateAsync({ transferId: transfer.id })
					toast.add({ title: 'Transfer berhasil dikirim.', type: 'success' })
				},
			})
		},
		[shipMut],
	)

	// ─── Receive ───

	const handleReceive = useCallback(
		async (transfer: TransferDto) => {
			const detailRes = await transferResource.detail.fetch({ id: transfer.id })
			const detail = detailRes.data

			await confirm({
				title: 'Terima transfer?',
				description: `Konfirmasi penerimaan ${transfer.transferNo} (${detail.lines.length} item). Stok akan diperbarui.`,
				confirmLabel: 'Terima',
				onConfirm: async () => {
					await receiveMut.mutateAsync({
						transferId: transfer.id,
						lines: detail.lines.map((l) => ({
							materialId: l.materialId,
							receivedQty: l.requestedQty,
						})),
					})
					toast.add({ title: 'Transfer berhasil diterima.', type: 'success' })
				},
			})
		},
		[receiveMut],
	)

	// ─── Columns with actions ───

	const baseColumns = useMemo(
		() => [
			col.accessor('transferNo', {
				header: 'No. Transfer',
				size: 140,
			}),
			col.accessor('status', {
				header: 'Status',
				size: 130,
				// oxlint-disable-next-line react/no-unstable-nested-components
				cell: ({ getValue }) => {
					const status = getValue()
					return (
						<StatusBadge variant={STATUS_VARIANTS[status]}>
							{TRANSFER_STATUS_LABELS[status]}
						</StatusBadge>
					)
				},
			}),
			col.accessor('fromLocationId', {
				header: 'Dari',
				size: 140,
				cell: ({ getValue }) => locationMap.get(getValue()) ?? `#${getValue()}`,
			}),
			col.accessor('toLocationId', {
				header: 'Ke',
				size: 140,
				cell: ({ getValue }) => locationMap.get(getValue()) ?? `#${getValue()}`,
			}),
			col.accessor('notes', {
				header: 'Catatan',
				size: 200,
				// oxlint-disable-next-line react/no-unstable-nested-components
				cell: ({ getValue }) => getValue() ?? <span className="text-muted-foreground">—</span>,
			}),
			col.accessor('createdAt', {
				header: 'Tanggal',
				size: 140,
				cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('id-ID'),
			}),
		],
		[locationMap],
	)

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 60,
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => {
				const transfer = row.original
				const items = []

				if (canShip && transfer.status === 'requested' && transfer.fromLocationId === locationId) {
					items.push({
						label: 'Kirim',
						icon: <SendIcon className="size-4" />,
						onClick: () => handleShip(transfer),
					})
				}

				if (
					canReceive &&
					transfer.status === 'in_transit' &&
					transfer.toLocationId === locationId
				) {
					items.push({
						label: 'Terima',
						icon: <TruckIcon className="size-4" />,
						onClick: () => handleReceive(transfer),
					})
				}

				items.push({
					label: 'Detail',
					icon: <PackageIcon className="size-4" />,
					onClick: () => setSelectedTransferId(transfer.id),
				})

				return <ActionMenu items={items} />
			},
		})
	}, [canShip, canReceive, handleShip, handleReceive, locationId])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, TransferDto>[],
		[baseColumns, actionsColumn],
	)

	const { table } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	// ─── No location ───

	if (!locationId) {
		return (
			<div className="space-y-6">
				<PageHeader title="Transfer Inventori" description="Transfer bahan baku antar lokasi." />
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk melihat data transfer."
					icon={<PackageIcon className="size-5" />}
				/>
			</div>
		)
	}

	// ─── Detail View ───

	if (selectedTransferId && detail) {
		return (
			<div className="space-y-6">
				<PageHeader
					title={detail.transferNo}
					description={`Status: ${TRANSFER_STATUS_LABELS[detail.status]}`}
				/>

				<Button size="sm" variant="ghost" onClick={() => setSelectedTransferId(null)}>
					<ArrowLeftIcon className="size-3.5" />
					Kembali ke daftar
				</Button>

				<DetailList
					items={[
						{
							label: 'Dari',
							value: locationMap.get(detail.fromLocationId) ?? `#${detail.fromLocationId}`,
						},
						{
							label: 'Ke',
							value: locationMap.get(detail.toLocationId) ?? `#${detail.toLocationId}`,
						},
						{
							label: 'Status',
							value: (
								<StatusBadge variant={STATUS_VARIANTS[detail.status]}>
									{TRANSFER_STATUS_LABELS[detail.status]}
								</StatusBadge>
							),
						},
						{
							label: 'Tanggal',
							value: new Date(detail.createdAt).toLocaleDateString('id-ID'),
						},
						{ label: 'Catatan', value: detail.notes ?? '—' },
					]}
				/>

				<div className="space-y-3">
					<h3 className="text-sm font-medium">Item Transfer ({detail.lines.length})</h3>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/50">
								<tr>
									<th className="px-3 py-2 text-left font-medium">Material</th>
									<th className="px-3 py-2 text-right font-medium">Diminta</th>
									<th className="px-3 py-2 text-right font-medium">Dikirim</th>
									<th className="px-3 py-2 text-right font-medium">Diterima</th>
									<th className="px-3 py-2 text-left font-medium">Satuan</th>
								</tr>
							</thead>
							<tbody>
								{detail.lines.map((line) => (
									<tr key={line.id} className="border-t">
										<td className="px-3 py-2">
											{materialsMap.get(line.materialId) ?? `#${line.materialId}`}
										</td>
										<td className="px-3 py-2 text-right">{line.requestedQty}</td>
										<td className="px-3 py-2 text-right">
											{line.shippedQty ?? <span className="text-muted-foreground">—</span>}
										</td>
										<td className="px-3 py-2 text-right">
											{line.receivedQty ?? <span className="text-muted-foreground">—</span>}
										</td>
										<td className="px-3 py-2">{uomsMap.get(line.uomId) ?? `#${line.uomId}`}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{canReadAudit && (
					<PageSection title="Activity" description="History of changes to this transfer.">
						<AuditTrail
							entries={auditQuery.data?.data ?? []}
							isLoading={auditQuery.isLoading}
							emptyMessage="No changes recorded for this transfer yet."
						/>
					</PageSection>
				)}
			</div>
		)
	}

	if (selectedTransferId && !detail) {
		return (
			<div className="space-y-6">
				<PageHeader title="Detail Transfer" description="Memuat..." />
				<Button size="sm" variant="ghost" onClick={() => setSelectedTransferId(null)}>
					<ArrowLeftIcon className="size-3.5" />
					Kembali ke daftar
				</Button>
			</div>
		)
	}

	// ─── Render ───

	const isEmpty = !listQuery.isLoading && data.length === 0 && !search.status

	return (
		<div className="space-y-6">
			<PageHeader
				title="Transfer Inventori"
				description={`Transfer antar lokasi dari ${activeLocation?.name ?? ''}`}
				actions={
					canCreate ? (
						<Button size="sm" onClick={() => navigate({ to: '/inventory/transfers/new' })}>
							<PlusIcon className="size-4" />
							Buat Transfer
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="Belum ada transfer"
					description="Buat transfer pertama untuk memindahkan bahan antar lokasi."
					action={
						canCreate ? (
							<Button size="sm" onClick={() => navigate({ to: '/inventory/transfers/new' })}>
								<PlusIcon className="size-4" />
								Buat Transfer
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada transfer ditemukan."
					toolbar={
						<TableToolbar
							filters={[
								{
									key: 'status',
									label: 'Status',
									value: search.status,
									onChange: (v) =>
										navigate({
											search: {
												...search,
												page: 1,
												status: v as TransferStatusEnum | undefined,
											},
										}),
									options: Object.entries(TRANSFER_STATUS_LABELS).map(([value, label]) => ({
										label,
										value,
									})),
									allLabel: 'All status',
								},
							]}
							dateRange={{
								key: 'createdAt',
								label: 'Tanggal',
								value: dateRange,
								onChange: (v) => {
									setDateRange(v)
									if (search.page !== 1) navigate({ search: { ...search, page: 1 } })
								},
								placeholder: 'Filter tanggal transfer',
							}}
						/>
					}
				/>
			)}
		</div>
	)
}
