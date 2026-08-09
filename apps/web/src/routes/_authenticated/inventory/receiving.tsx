import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { CheckCircleIcon, PackageIcon, PlusIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { ActionMenu } from '@/components/shared/action-menu'
import { confirm } from '@/components/shared/confirm'
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
	col.accessor('supplierId', {
		header: 'Supplier',
		size: 100,
		cell: ({ getValue }) => `#${getValue()}`,
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

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		locationId: locationId,
		status: undefined as ReceivingStatusEnum | undefined,
	})

	const listQuery = useQuery({
		...receivingResource.list.queryOptions({
			...listParams,
			locationId: locationId,
		}),
		enabled: !!locationId,
	})

	const createMut = useMutation(receivingResource.create.mutationOptions())
	const confirmMut = useMutation(receivingResource.confirm.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

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
		async (receiving: ReceivingDto) => {
			await confirm({
				title: 'Konfirmasi penerimaan?',
				description: `Penerimaan ${receiving.receivingNo} akan dikonfirmasi dan stok akan diperbarui. Lanjutkan?`,
				confirmLabel: 'Konfirmasi',
				onConfirm: async () => {
					await confirmMut.mutateAsync({ receivingId: receiving.id })
					toast.add({ title: 'Penerimaan berhasil dikonfirmasi.', type: 'success' })
				},
			})
		},
		[confirmMut],
	)

	// ─── Columns with actions ───

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => {
				const receiving = row.original
				const items = []

				if (receiving.status === 'draft') {
					items.push({
						label: 'Konfirmasi',
						icon: <CheckCircleIcon className="size-4" />,
						onClick: () => handleConfirm(receiving),
					})
				}

				if (items.length === 0) return null
				return <ActionMenu items={items} />
			},
		})
	}, [handleConfirm])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, ReceivingDto>[],
		[actionsColumn],
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

	// ─── Render ───

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
