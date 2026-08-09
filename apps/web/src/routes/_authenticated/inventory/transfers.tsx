import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { PackageIcon, PlusIcon, SendIcon, TruckIcon } from 'lucide-react'

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

import { transferResource } from '@/features/inventory/api.ts'
import { TransferForm } from '@/features/inventory/components/transfer-form.tsx'
import type { TransferFormRef } from '@/features/inventory/components/transfer-form.tsx'
import { TRANSFER_STATUS_LABELS } from '@/features/inventory/dto/index.ts'
import type { TransferDto, TransferStatusEnum } from '@/features/inventory/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/transfers')({
	component: TransfersPage,
})

// ─── Helpers ───

const STATUS_VARIANTS: Record<TransferStatusEnum, StatusBadgeVariant> = {
	requested: 'info',
	in_transit: 'warning',
	received: 'success',
	cancelled: 'destructive',
}

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, TransferDto>()

const baseColumns = [
	col.accessor('transferNo', {
		header: 'No. Transfer',
		size: 140,
	}),
	col.accessor('status', {
		header: 'Status',
		size: 130,
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
		size: 100,
		cell: ({ getValue }) => `#${getValue()}`,
	}),
	col.accessor('toLocationId', {
		header: 'Ke',
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

function TransfersPage() {
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		locationId: locationId,
		status: undefined as TransferStatusEnum | undefined,
	})

	const listQuery = useQuery({
		...transferResource.list.queryOptions({
			...listParams,
			locationId: locationId,
		}),
		enabled: !!locationId,
	})

	const createMut = useMutation(transferResource.create.mutationOptions())
	const shipMut = useMutation(transferResource.ship.mutationOptions())
	const receiveMut = useMutation(transferResource.receive.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	// ─── Create ───

	const handleCreate = useCallback(async () => {
		if (!locationId) return
		const formRef = { current: null } as React.MutableRefObject<TransferFormRef | null>

		const saved = await formDialog({
			title: 'Buat Transfer',
			description: 'Buat permintaan transfer bahan antar lokasi.',
			submitLabel: 'Buat Transfer',
			content: (
				<TransferForm
					ref={(el) => {
						formRef.current = el
					}}
					fromLocationId={locationId}
				/>
			),
			onSubmit: async () => {
				const errors = formRef.current?.validate()
				if (errors) throw new Error('Perbaiki kesalahan validasi.')
				const v = formRef.current!.getValues()
				await createMut.mutateAsync({
					fromLocationId: Number(v.fromLocationId),
					toLocationId: Number(v.toLocationId),
					notes: v.notes || null,
					lines: v.lines.map((l) => ({
						materialId: Number(l.materialId),
						qty: l.qty,
						uomId: Number(l.uomId),
					})),
				})
			},
		})

		if (saved) {
			toast.add({ title: 'Transfer berhasil dibuat.', type: 'success' })
		}
	}, [createMut, locationId])

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

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 60,
			cell: ({ row }) => {
				const transfer = row.original
				const items = []

				if (transfer.status === 'requested' && transfer.fromLocationId === locationId) {
					items.push({
						label: 'Kirim',
						icon: <SendIcon className="size-4" />,
						onClick: () => handleShip(transfer),
					})
				}

				if (transfer.status === 'in_transit' && transfer.toLocationId === locationId) {
					items.push({
						label: 'Terima',
						icon: <TruckIcon className="size-4" />,
						onClick: () => handleReceive(transfer),
					})
				}

				if (items.length === 0) return null
				return <ActionMenu items={items} />
			},
		})
	}, [handleShip, handleReceive, locationId])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, TransferDto>[],
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
					title="Transfer Inventori"
					description="Transfer bahan baku antar lokasi."
				/>
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk melihat data transfer."
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
				title="Transfer Inventori"
				description={`Transfer antar lokasi dari ${activeLocation?.name ?? ''}`}
				actions={
					<Button size="sm" onClick={handleCreate}>
						<PlusIcon className="size-4" />
						Buat Transfer
					</Button>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="Belum ada transfer"
					description="Buat transfer pertama untuk memindahkan bahan antar lokasi."
					action={
						<Button size="sm" onClick={handleCreate}>
							<PlusIcon className="size-4" />
							Buat Transfer
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada transfer ditemukan."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Cari transfer..."
						/>
					}
				/>
			)}
		</div>
	)
}
