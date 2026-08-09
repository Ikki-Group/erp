import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import {
	ArrowLeftIcon,
	CheckCircleIcon,
	ClipboardListIcon,
	PlusIcon,
} from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { confirm } from '@/components/shared/confirm'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SearchToolbar } from '@/components/shared/search-toolbar'
import { StatusBadge } from '@/components/shared/status-badge'
import type { StatusBadgeVariant } from '@/components/shared/status-badge'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { opnameResource } from '@/features/inventory/api.ts'
import { OpnameCountForm } from '@/features/inventory/components/opname-count-form.tsx'
import { OPNAME_STATUS_LABELS } from '@/features/inventory/dto/index.ts'
import type { OpnameDto, OpnameStatusEnum } from '@/features/inventory/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/inventory/opname')({
	component: OpnamePage,
})

// ─── Helpers ───

const STATUS_VARIANTS: Record<OpnameStatusEnum, StatusBadgeVariant> = {
	draft: 'default',
	in_progress: 'warning',
	completed: 'success',
	cancelled: 'destructive',
}

// ─── Table Columns ───

const col = createColumnHelper<DataGridFeatures, OpnameDto>()

const baseColumns = [
	col.accessor('opnameNo', {
		header: 'No. Opname',
		size: 140,
	}),
	col.accessor('status', {
		header: 'Status',
		size: 130,
		cell: ({ getValue }) => {
			const status = getValue()
			return (
				<StatusBadge variant={STATUS_VARIANTS[status]}>
					{OPNAME_STATUS_LABELS[status]}
				</StatusBadge>
			)
		},
	}),
	col.accessor('createdAt', {
		header: 'Tanggal',
		size: 140,
		cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('id-ID'),
	}),
	col.accessor('completedAt', {
		header: 'Selesai',
		size: 140,
		cell: ({ getValue }) => {
			const val = getValue()
			return val ? new Date(val).toLocaleDateString('id-ID') : (
				<span className="text-muted-foreground">—</span>
			)
		},
	}),
]

// ─── Page ───

function OpnamePage() {
	const { activeLocation } = useLocationContext()
	const locationId = activeLocation?.id

	const [selectedOpnameId, setSelectedOpnameId] = useState<number | null>(null)

	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
		locationId: locationId,
	})

	const listQuery = useQuery({
		...opnameResource.list.queryOptions({
			...listParams,
			locationId: locationId,
		}),
		enabled: !!locationId,
	})

	const createMut = useMutation(opnameResource.create.mutationOptions())
	const updateCountsMut = useMutation(opnameResource.updateCounts.mutationOptions())
	const approveMut = useMutation(opnameResource.approve.mutationOptions())

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	// ─── Detail query ───

	const detailQuery = useQuery({
		...opnameResource.detail.queryOptions({ id: selectedOpnameId! }),
		enabled: !!selectedOpnameId,
	})
	const detail = detailQuery.data?.data

	// ─── Create ───

	const handleCreate = useCallback(async () => {
		if (!locationId) return
		await createMut.mutateAsync({ locationId })
		toast.add({ title: 'Opname berhasil dibuat.', type: 'success' })
	}, [createMut, locationId])

	// ─── Submit Counts ───

	const handleSubmitCounts = useCallback(
		async (lines: { materialId: number; countedQty: string; reason: string }[]) => {
			if (!selectedOpnameId) return
			await updateCountsMut.mutateAsync({
				opnameId: selectedOpnameId,
				lines: lines.map((l) => ({
					materialId: l.materialId,
					countedQty: l.countedQty,
					reason: l.reason || undefined,
				})),
			})
			toast.add({ title: 'Hitungan berhasil disimpan.', type: 'success' })
		},
		[updateCountsMut, selectedOpnameId],
	)

	// ─── Approve ───

	const handleApprove = useCallback(async () => {
		if (!selectedOpnameId) return
		await confirm({
			title: 'Setujui opname?',
			description:
				'Setelah disetujui, penyesuaian stok akan dibuat berdasarkan selisih hitungan. Tindakan ini tidak dapat dibatalkan.',
			confirmLabel: 'Setujui',
			onConfirm: async () => {
				await approveMut.mutateAsync({ opnameId: selectedOpnameId })
				toast.add({ title: 'Opname disetujui. Penyesuaian stok telah dibuat.', type: 'success' })
			},
		})
	}, [approveMut, selectedOpnameId])

	// ─── Columns with row click ───

	const actionsColumn = useMemo(() => {
		return col.display({
			id: 'actions',
			size: 80,
			cell: ({ row }) => (
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setSelectedOpnameId(row.original.id)}
				>
					Detail
				</Button>
			),
		})
	}, [])

	const columns = useMemo(
		() => [...baseColumns, actionsColumn] as ColumnDef<DataGridFeatures, OpnameDto>[],
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
					title="Stock Opname"
					description="Hitung fisik stok dan bandingkan dengan stok sistem."
				/>
				<EmptyState
					title="Pilih lokasi"
					description="Pilih lokasi aktif untuk memulai opname."
					icon={<ClipboardListIcon className="size-5" />}
				/>
			</div>
		)
	}

	// ─── Detail View ───

	if (selectedOpnameId) {
		const isEditable = detail?.status === 'draft' || detail?.status === 'in_progress'
		const canApprove = detail?.status === 'in_progress'

		return (
			<div className="space-y-6">
				<PageHeader
					title={detail?.opnameNo ?? 'Detail Opname'}
					description={`Status: ${detail ? OPNAME_STATUS_LABELS[detail.status] : '...'}`}
					actions={
						<div className="flex gap-2">
							{canApprove && (
								<Button size="sm" onClick={handleApprove}>
									<CheckCircleIcon className="size-4" />
									Setujui
								</Button>
							)}
						</div>
					}
				/>

				<Button
					size="sm"
					variant="ghost"
					onClick={() => setSelectedOpnameId(null)}
				>
					<ArrowLeftIcon className="size-3.5" />
					Kembali ke daftar
				</Button>

				{detailQuery.isLoading ? (
					<div className="py-12 text-center text-sm text-muted-foreground">
						Memuat data opname...
					</div>
				) : detail?.lines.length === 0 ? (
					<EmptyState
						title="Tidak ada material"
						description="Opname ini tidak memiliki baris material."
					/>
				) : detail ? (
					<OpnameCountForm
						lines={detail.lines}
						isEditable={isEditable}
						onSubmitCounts={handleSubmitCounts}
						isSubmitting={updateCountsMut.isPending}
					/>
				) : null}
			</div>
		)
	}

	// ─── List View ───

	const isEmpty = !listQuery.isLoading && data.length === 0 && !globalFilter

	return (
		<div className="space-y-6">
			<PageHeader
				title="Stock Opname"
				description={`Hitung fisik stok di ${activeLocation?.name ?? ''}`}
				actions={
					<Button size="sm" onClick={handleCreate} disabled={createMut.isPending}>
						<PlusIcon className="size-4" />
						Buat Opname
					</Button>
				}
			/>

			{isEmpty ? (
				<EmptyState
					title="Belum ada opname"
					description="Buat opname pertama untuk memulai penghitungan fisik stok."
					action={
						<Button size="sm" onClick={handleCreate} disabled={createMut.isPending}>
							<PlusIcon className="size-4" />
							Buat Opname
						</Button>
					}
				/>
			) : (
				<DataTable
					table={table}
					recordCount={totalCount}
					isLoading={listQuery.isLoading}
					emptyMessage="Tidak ada opname ditemukan."
					toolbar={
						<SearchToolbar
							value={globalFilter}
							onChange={setGlobalFilter}
							placeholder="Cari opname..."
						/>
					}
				/>
			)}
		</div>
	)
}
