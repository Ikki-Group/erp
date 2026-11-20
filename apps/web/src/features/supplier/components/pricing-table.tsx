import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { toDisplayCurrency } from '@/lib/currency'

import {
	createEntityColumns,
	DataTable,
	EmptyCell,
	rightAlignedHeader,
	TextCell,
	useResourceList,
} from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { formDialog } from '@/components/shared/form-dialog'
import { useWorkflowAction } from '@/components/shared/workflow-action'

import { Button } from '@/components/ui/button'

import { materialResource } from '@/features/material/api'
import { uomResource } from '@/features/uom/api'

import { pricingResource } from '../api.ts'
import type { SupplierMaterialDto } from '../dto/index.ts'
import { PricingForm } from './pricing-form'

interface PricingLabelProps {
	id: number
	kind: 'Material' | 'UoM'
	record?: { name: string; code: string }
	isError: boolean
	isFetching: boolean
	retry: () => void
}

const KIND_LABELS: Record<PricingLabelProps['kind'], string> = {
	Material: 'Bahan',
	UoM: 'Satuan',
}

function PricingLabel({ id, kind, record, isError, isFetching, retry }: PricingLabelProps) {
	return (
		<div className="min-w-0 space-y-1">
			{record ? (
				<>
					{kind === 'Material' && <TextCell value={record.name} truncate />}
					<TextCell value={record.code} mono muted={kind === 'Material'} />
				</>
			) : (
				<TextCell
					value={`${KIND_LABELS[kind]} #${id} — ${isError ? 'tidak tersedia' : 'memuat…'}`}
					muted
				/>
			)}
			{isError && (
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={isFetching}
					aria-label={`Coba lagi ${KIND_LABELS[kind].toLowerCase()} #${id}`}
					onClick={retry}
				>
					Muat ulang label
				</Button>
			)}
		</div>
	)
}

function PricingMaterial({ id }: { id: number }) {
	const query = useQuery({
		...materialResource.detail.queryOptions({ id }),
		throwOnError: false,
	})
	return (
		<PricingLabel
			id={id}
			kind="Material"
			record={query.data?.data}
			isError={query.isError}
			isFetching={query.isFetching}
			retry={() => void query.refetch()}
		/>
	)
}

function PricingUom({ id }: { id: number }) {
	const query = useQuery({
		...uomResource.detail.queryOptions({ id }),
		throwOnError: false,
	})
	return (
		<PricingLabel
			id={id}
			kind="UoM"
			record={query.data?.data}
			isError={query.isError}
			isFetching={query.isFetching}
			retry={() => void query.refetch()}
		/>
	)
}

const col = createEntityColumns<SupplierMaterialDto>()
const baseColumns = [
	col.text('materialId', {
		header: 'Bahan',
		size: 240,
		enableSorting: false,
		cell: ({ row }) => <PricingMaterial id={row.original.materialId} />,
	}),
	col.text('unitPrice', {
		header: rightAlignedHeader('Harga Satuan'),
		size: 170,
		enableSorting: false,
		cell: ({ row }) => (
			<TextCell
				value={`Rp ${toDisplayCurrency(row.original.unitPrice)}`}
				mono
				className="block text-right tabular-nums"
			/>
		),
	}),
	col.text('uomId', {
		header: 'Satuan',
		size: 100,
		enableSorting: false,
		cell: ({ row }) => <PricingUom id={row.original.uomId} />,
	}),
	col.text('minOrderQty', {
		header: rightAlignedHeader('Min. Jumlah Pesanan'),
		size: 140,
		enableSorting: false,
		cell: ({ row }) =>
			row.original.minOrderQty === null ? (
				<EmptyCell className="block text-right" />
			) : (
				<TextCell
					value={toDisplayCurrency(row.original.minOrderQty)}
					mono
					className="block text-right tabular-nums"
				/>
			),
	}),
]

export interface PricingPermissions {
	read: boolean
	create: boolean
	update: boolean
	delete: boolean
}

interface PricingTableProps {
	supplierId: number
	/** Resolve in the authenticated route: callable dialog roots do not inherit auth context. */
	permissions: PricingPermissions
}

/** Each supplier opens a new local pagination session; no dialog state enters the route URL. */
export function PricingTable({ supplierId, permissions }: PricingTableProps) {
	if (!permissions.read)
		return <p role="alert">Anda tidak memiliki izin untuk melihat harga pemasok.</p>
	return <SupplierPricingList key={supplierId} supplierId={supplierId} permissions={permissions} />
}

function SupplierPricingList({ supplierId, permissions }: PricingTableProps) {
	const [search, setSearch] = useState({ page: 1, pageSize: 20 })
	const [editing, setEditing] = useState(false)
	const editorOpen = useRef(false)
	const { create: canCreate, update: canUpdate, delete: canDelete } = permissions
	const listQuery = useQuery({
		...pricingResource.list.queryOptions({ supplierId, page: search.page, limit: search.pageSize }),
		throwOnError: false,
	})
	const totalPages = Math.max(1, listQuery.data?.meta.totalPages ?? search.page)

	useEffect(() => {
		if (listQuery.isSuccess && !listQuery.isFetching && search.page > totalPages) {
			setSearch((current) => ({ ...current, page: totalPages }))
		}
	}, [listQuery.isSuccess, listQuery.isFetching, search.page, totalPages])

	const handleEdit = useCallback(
		async (pricing?: SupplierMaterialDto) => {
			if (editorOpen.current || (pricing ? !canUpdate : !canCreate)) return
			editorOpen.current = true
			setEditing(true)
			try {
				await formDialog({
					title: pricing ? 'Ubah Harga' : 'Tambah Harga Bahan',
					description: pricing
						? 'Perbarui harga dan satuan pemesanan untuk bahan ini.'
						: 'Tetapkan harga bahan dari pemasok ini.',
					className: 'max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg',
					// oxlint-disable-next-line react/no-unstable-nested-components
					content: ({ close }) => (
						<PricingForm
							key={pricing?.id ?? 'new'}
							supplierId={supplierId}
							pricing={pricing}
							canSave={permissions.read && (pricing ? canUpdate : canCreate)}
							onSaved={() => close(true)}
							onCancel={() => close(false)}
						/>
					),
				})
			} finally {
				editorOpen.current = false
				setEditing(false)
			}
		},
		[canCreate, canUpdate, permissions.read, supplierId],
	)

	const { run: handleRemove, isPending: removing } = useWorkflowAction<SupplierMaterialDto>({
		availability: () => permissions.read && canDelete && !editorOpen.current,
		confirmation: (pricing) => ({
			title: 'Hapus harga?',
			description: `Hapus harga untuk bahan #${pricing.materialId}? Tindakan ini tidak dapat dibatalkan.`,
			confirmLabel: 'Hapus',
			variant: 'destructive',
		}),
		execute: async (pricing) => {
			await pricingResource.remove.fetch({ id: pricing.id })
			if (listQuery.data?.data.length === 1 && search.page > 1) {
				setSearch((current) =>
					current.page === search.page ? { ...current, page: current.page - 1 } : current,
				)
			}
		},
		successMessage: 'Harga berhasil dihapus.',
	})

	const columns = useMemo(
		() =>
			[
				...baseColumns,
				col.actions({
					label: 'Tindakan harga',
					// oxlint-disable-next-line react/no-unstable-nested-components
					getItems: (pricing) => [
						canUpdate && {
							label: 'Ubah',
							icon: <EditIcon />,
							onClick: () => handleEdit(pricing),
							disabled: editing || removing,
						},
						canDelete && {
							label: 'Hapus',
							icon: <TrashIcon />,
							onClick: () => handleRemove(pricing),
							variant: 'destructive' as const,
							disabled: editing || removing,
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, SupplierMaterialDto>[],
		[canUpdate, canDelete, editing, removing, handleEdit, handleRemove],
	)
	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: setSearch,
	})

	return (
		<div className="min-w-0 space-y-3" aria-busy={list.isRefreshing}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-xs text-muted-foreground">Harga dan jumlah minimum per bahan.</p>
				{canCreate && (
					<Button size="sm" onClick={() => handleEdit()} disabled={editing || removing}>
						<PlusIcon />
						Tambah Harga
					</Button>
				)}
			</div>
			{list.state === 'refresh-error' && (
				<div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-sm">
					<p>Gagal memuat ulang harga. Menampilkan hasil terakhir yang dimuat.</p>
					<Button size="sm" variant="outline" disabled={list.isRefreshing} onClick={list.retry}>
						Coba lagi
					</Button>
				</div>
			)}
			{list.isRefreshing && (
				<p role="status" className="text-xs text-muted-foreground">
					Refreshing pricing…
				</p>
			)}
			<DataTable
				table={list.table}
				recordCount={list.recordCount}
				isLoading={list.state === 'initial-loading'}
				isError={list.state === 'initial-error'}
				errorTitle="Gagal memuat harga"
				errorMessage="Coba lagi untuk memuat harga bahan pemasok ini."
				onRetry={list.retry}
				emptyMessage="Belum ada data harga untuk pemasok ini."
				showPagination={false}
			/>
			<div className="flex flex-wrap items-center justify-end gap-2">
				<Button
					size="sm"
					variant="outline"
					disabled={search.page <= 1}
					onClick={() => setSearch((current) => ({ ...current, page: current.page - 1 }))}
				>
					Sebelumnya
				</Button>
				<span className="text-xs text-muted-foreground">
					Halaman {search.page} dari {totalPages}
				</span>
				<Button
					size="sm"
					variant="outline"
					disabled={search.page >= totalPages}
					onClick={() => setSearch((current) => ({ ...current, page: current.page + 1 }))}
				>
					Berikutnya
				</Button>
			</div>
		</div>
	)
}
