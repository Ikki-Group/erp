import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowLeftIcon, CheckCircleIcon, PackageIcon, PlusIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { confirm } from '@/components/shared/confirm'
import { DetailList } from '@/components/shared/detail-list'
import { EmptyState } from '@/components/shared/empty-state'
import { formDialog } from '@/components/shared/form-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { SearchToolbar } from '@/components/shared/search-toolbar'
import { StatusBadge } from '@/components/shared/status-badge'
import type { StatusBadgeVariant } from '@/components/shared/status-badge'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { receivingResource } from '@/features/inventory/api.ts'
import { ReceivingForm } from '@/features/inventory/components/receiving-form.tsx'
import type { ReceivingFormRef } from '@/features/inventory/components/receiving-form.tsx'
import { RECEIVING_STATUS_LABELS } from '@/features/inventory/dto/index.ts'
import type { ReceivingDto, ReceivingStatusEnum } from '@/features/inventory/dto/index.ts'
import { materialResource } from '@/features/material/api.ts'
import { supplierResource } from '@/features/supplier/api.ts'
import { uomResource } from '@/features/uom/api.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/receiving')({
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
	const locationId = activeLocation?.id

	const [selectedReceivingId, setSelectedReceivingId] = useState<number | null>(null)

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
	})

	const listQuery = useQuery({
		...receivingResource.list.queryOptions({
			...listParams,
			locationId,
		}),
		enabled: !!locationId,
	})

	const createMut = useMutation(receivingResource.create.mutationOptions())
	const confirmMut = useMutation(receivingResource.confirm.mutationOptions())

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

	// ─── Create ───

	const handleCreate = useCallback(async () => {
		if (!locationId) return
		const formRef = { current: null } as React.MutableRefObject<ReceivingFormRef | null>

		const saved = await formDialog({
			title: 'Buat Penerimaan',
			description: 'Catat penerimaan barang dari supplier.',
			submitLabel: 'Simpan',
			content: (
				<ReceivingForm
					ref={(el) => {
						formRef.current = el
					}}
					locationId={locationId}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Perbaiki kesalahan validasi.')
				const v = formRef.current!.getValues()
				await createMut.mutateAsync({
					locationId,
					supplierId: Number(v.supplierId),
					notes: v.notes || null,
					lines: v.lines
						.filter((l) => l.materialId && l.qty)
						.map((l) => ({
							materialId: Number(l.materialId),
							qty: l.qty,
							unitCost: l.unitCost,
							uomId: Number(l.uomId),
						})),
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Penerimaan berhasil dibuat.', type: 'success' })
		}
	}, [createMut, locationId])

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

	const { table, globalFilter, setGlobalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		pageSize: listParams.limit,
		onStateChange: (params) => {
			setListParams((prev) => ({
				...prev,
				page: params.page + 1,
				limit: params.pageSize,
			}))
		},
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
						canConfirm ? (
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

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Penerimaan Barang"
				description={`Penerimaan dari supplier ke ${activeLocation?.name ?? ''}`}
				actions={
					<Button size="sm" onClick={handleCreate}>
						<PlusIcon className="size-4" />
						Buat Penerimaan
					</Button>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="Belum ada penerimaan"
					description="Buat penerimaan pertama untuk mencatat barang masuk dari supplier."
					action={
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Buat Penerimaan
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada penerimaan ditemukan."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Cari penerimaan..."
						/>
					}
				/>
			)}
		</div>
	)
}
