import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowLeftIcon, CheckCircleIcon, PackageIcon, PlusIcon } from 'lucide-react'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import { DataTable } from '@/components/data-table/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
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
import { receivingResource } from '@/features/inventory/api.ts'
import { RECEIVING_STATUS_LABELS, ReceivingStatusEnum } from '@/features/inventory/dto/index.ts'
import type { ReceivingDto } from '@/features/inventory/dto/index.ts'
import { materialResource } from '@/features/material/api.ts'
import { supplierResource } from '@/features/supplier/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

// No server-side text search on this endpoint — status filter + pagination only.
const receivingSearchSchema = listSearchSchema.omit({ q: true }).extend({
	status: ReceivingStatusEnum.optional(),
})

export const Route = createFileRoute('/_authenticated/inventory/receiving/')({
	validateSearch: receivingSearchSchema,
	component: ReceivingPage,
})

// ─── Helpers ───

const STATUS_VARIANTS: Record<ReceivingStatusEnum, StatusBadgeVariant> = {
	draft: 'warning',
	confirmed: 'success',
}

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, ReceivingDto>()

const baseColumns = [
	col.accessor('receivingNo', {
		header: 'No. Penerimaan',
		size: 160,
	}),
	col.accessor('status', {
		header: 'Status',
		size: 130,
		cell: ({ getValue }) => {
			const status = getValue()
			return (
				<StatusBadge variant={STATUS_VARIANTS[status]}>
					{RECEIVING_STATUS_LABELS[status]}
				</StatusBadge>
			)
		},
	}),
	col.accessor('notes', {
		header: 'Catatan',
		size: 200,
		cell: ({ getValue }) => getValue() ?? <span className="text-muted-foreground">—</span>,
	}),
	col.accessor('createdAt', {
		header: 'Tanggal',
		size: 140,
		cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('id-ID'),
	}),
]

// ─── Page ───

function ReceivingPage() {
	const { activeLocation } = useLocationContext()
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const locationId = activeLocation?.id
	const canCreate = usePermissionCheck({ permission: 'receiving.create' })
	const canConfirmPermission = usePermissionCheck({ permission: 'receiving.confirm' })
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })

	const [selectedReceivingId, setSelectedReceivingId] = useState<number | null>(null)
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

	const listQuery = useQuery({
		...receivingResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			status: search.status,
			locationId,
			dateFrom: dateRange?.from.toISOString(),
			dateTo: dateRange?.to.toISOString(),
		}),
		enabled: !!locationId,
	})

	const confirmMut = useMutation(receivingResource.confirm.mutationOptions())

	// Server filters by createdAt range (ReceivingFilterDto.dateFrom/dateTo), so
	// page + total count both honor the range — no client-side slicing.
	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	// ─── Lookup queries for name resolution ───

	const suppliersQuery = useQuery(supplierResource.list.queryOptions({ page: 1, limit: 100 }))
	const materialsQuery = useQuery(materialResource.list.queryOptions({ page: 1, limit: 200 }))
	const uomsQuery = useQuery(uomResource.list.queryOptions({ page: 1, limit: 100 }))

	const suppliersMap = useMemo(() => {
		const map = new Map<number, string>()
		for (const s of suppliersQuery.data?.data ?? []) {
			map.set(s.id, s.name)
		}
		return map
	}, [suppliersQuery.data])

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

	// ─── Detail query ───

	const detailQuery = useQuery({
		...receivingResource.detail.queryOptions({ id: selectedReceivingId! }),
		enabled: !!selectedReceivingId,
	})
	const detail = detailQuery.data?.data

	const auditQuery = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'receiving', entityId: selectedReceivingId! }),
		enabled: !!selectedReceivingId && canReadAudit,
	})

	// ─── Confirm ───

	const handleConfirm = useCallback(
		async (receivingId: number, receivingNo: string) => {
			await confirm({
				title: 'Konfirmasi penerimaan?',
				description: `Penerimaan ${receivingNo} akan dikonfirmasi dan stok akan diperbarui. Lanjutkan?`,
				confirmLabel: 'Konfirmasi',
				onConfirm: async () => {
					await confirmMut.mutateAsync({ receivingId })
					toast.add({ title: 'Penerimaan berhasil dikonfirmasi.', type: 'success' })
				},
			})
		},
		[confirmMut],
	)

	// ─── Columns with actions ───

	const supplierColumn = useMemo(() => {
		return col.display({
			id: 'supplierName',
			header: 'Supplier',
			size: 160,
			cell: ({ row }) => {
				const name = suppliersMap.get(row.original.supplierId)
				return name ?? `#${row.original.supplierId}`
			},
		})
	}, [suppliersMap])

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 80,
			// oxlint-disable-next-line react/no-unstable-nested-components
			cell: ({ row }) => {
				const receiving = row.original
				return (
					<div className="flex gap-1">
						<Button
							size="sm"
							variant="ghost"
							aria-label={`Detail ${receiving.receivingNo}`}
							onClick={() => setSelectedReceivingId(receiving.id)}
						>
							Detail
						</Button>
					</div>
				)
			},
		})
	}, [])

	const columns = useMemo(
		() =>
			[...baseColumns, supplierColumn, actionsColumn] as ColumnDef<
				DataGridFeatures,
				ReceivingDto
			>[],
		[supplierColumn, actionsColumn],
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
				<PageHeader
					title="Penerimaan Barang"
					description="Catat penerimaan barang dari supplier."
				/>
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk melihat data penerimaan."
					icon={<PackageIcon className="size-5" />}
				/>
			</div>
		)
	}

	// ─── Detail View ───

	if (selectedReceivingId && detail) {
		const canConfirm = detail.status === 'draft'

		return (
			<div className="space-y-6">
				<PageHeader
					title={detail.receivingNo}
					description={`Status: ${RECEIVING_STATUS_LABELS[detail.status]}`}
					actions={
						canConfirm && canConfirmPermission ? (
							<Button size="sm" onClick={() => handleConfirm(detail.id, detail.receivingNo)}>
								<CheckCircleIcon className="size-4" />
								Konfirmasi
							</Button>
						) : undefined
					}
				/>

				<Button size="sm" variant="ghost" onClick={() => setSelectedReceivingId(null)}>
					<ArrowLeftIcon className="size-3.5" />
					Kembali ke daftar
				</Button>

				<DetailList
					items={[
						{
							label: 'Supplier',
							value: suppliersMap.get(detail.supplierId) ?? `#${detail.supplierId}`,
						},
						{
							label: 'Status',
							value: (
								<StatusBadge variant={STATUS_VARIANTS[detail.status]}>
									{RECEIVING_STATUS_LABELS[detail.status]}
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
					<h3 className="text-sm font-medium">Item Penerimaan ({detail.lines.length})</h3>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/50">
								<tr>
									<th className="px-3 py-2 text-left font-medium">Material</th>
									<th className="px-3 py-2 text-right font-medium">Jumlah</th>
									<th className="px-3 py-2 text-left font-medium">Satuan</th>
									<th className="px-3 py-2 text-right font-medium">Harga Satuan</th>
									<th className="px-3 py-2 text-right font-medium">Subtotal</th>
								</tr>
							</thead>
							<tbody>
								{detail.lines.map((line) => {
									const subtotal = Number(line.quantity) * Number(line.unitCost)
									return (
										<tr key={line.id} className="border-t">
											<td className="px-3 py-2">
												{materialsMap.get(line.materialId) ?? `#${line.materialId}`}
											</td>
											<td className="px-3 py-2 text-right">{line.quantity}</td>
											<td className="px-3 py-2">{uomsMap.get(line.uomId) ?? `#${line.uomId}`}</td>
											<td className="px-3 py-2 text-right">
												{Number(line.unitCost).toLocaleString('id-ID')}
											</td>
											<td className="px-3 py-2 text-right font-medium">
												{subtotal.toLocaleString('id-ID')}
											</td>
										</tr>
									)
								})}
							</tbody>
							<tfoot className="border-t bg-muted/30">
								<tr>
									<td colSpan={4} className="px-3 py-2 text-right font-medium">
										Total
									</td>
									<td className="px-3 py-2 text-right font-medium">
										{detail.lines
											.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitCost), 0)
											.toLocaleString('id-ID')}
									</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>

				{canReadAudit && (
					<PageSection title="Activity" description="History of changes to this receiving.">
						<AuditTrail
							entries={auditQuery.data?.data ?? []}
							isLoading={auditQuery.isLoading}
							emptyMessage="No changes recorded for this receiving yet."
						/>
					</PageSection>
				)}
			</div>
		)
	}

	// ─── Loading detail ───

	if (selectedReceivingId && !detail) {
		return (
			<div className="space-y-6">
				<PageHeader title="Detail Penerimaan" description="Memuat..." />
				<Button size="sm" variant="ghost" onClick={() => setSelectedReceivingId(null)}>
					<ArrowLeftIcon className="size-3.5" />
					Kembali ke daftar
				</Button>
			</div>
		)
	}

	// ─── List View ───

	const isEmpty = !listQuery.isLoading && data.length === 0 && !search.status

	return (
		<div className="space-y-6">
			<PageHeader
				title="Penerimaan Barang"
				description={`Penerimaan dari supplier ke ${activeLocation?.name ?? ''}`}
				actions={
					canCreate ? (
						<Button size="sm" onClick={() => navigate({ to: '/inventory/receiving/new' })}>
							<PlusIcon className="size-4" />
							Buat Penerimaan
						</Button>
					) : undefined
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="Belum ada penerimaan"
					description="Buat penerimaan pertama untuk mencatat barang masuk dari supplier."
					action={
						canCreate ? (
							<Button size="sm" onClick={() => navigate({ to: '/inventory/receiving/new' })}>
								<PlusIcon className="size-4" />
								Buat Penerimaan
							</Button>
						) : undefined
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada penerimaan ditemukan."
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
												status: v as ReceivingStatusEnum | undefined,
											},
										}),
									options: Object.entries(RECEIVING_STATUS_LABELS).map(([value, label]) => ({
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
								placeholder: 'Filter tanggal penerimaan',
							}}
						/>
					}
				/>
			)}
		</div>
	)
}
