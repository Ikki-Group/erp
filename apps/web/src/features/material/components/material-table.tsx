import { useMemo, useState } from 'react'

import { useMutation, useQuery, useSuspenseQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import {
	ChefHatIcon,
	EyeIcon,
	MapPinIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toastLabelMessage } from '@/lib/toast-message'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Badge } from '@/components/reui/badge'
import {
	actionColumn,
	createColumnHelper,
	dateColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { locationApi } from '@/features/location'
import { materialCategoryApi } from '@/features/material/api/material-category.api'

import { materialApi } from '../api'
import type { MaterialFilterDto, MaterialSelectDto } from '../dto'
import { MaterialBadgeProps } from '../utils'
import { MaterialAssignToLocationDialog } from './material-assign-to-location-dialog'

const ch = createColumnHelper<MaterialSelectDto>()

function getColumns(handleDelete: (id: number) => Promise<void>) {
	return [
		ch.display({
			id: 'select',
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(value)}
					aria-label="Select row"
				/>
			),
			size: 40,
			enableSorting: false,
			enableHiding: false,
		}),
		ch.accessor('name', {
			header: 'Bahan Baku',
			size: 350,
			enableSorting: true,
			cell: ({ row }) => {
				const material = row.original
				return (
					<div className="flex flex-col gap-0.5 py-1">
						<div className="flex items-center gap-2">
							<Link
								to="/material/$id"
								params={{ id: String(material.id) }}
								className="font-medium hover:text-primary hover:underline"
							>
								{material.name}
							</Link>
							<Badge variant="outline" size="sm" className="font-mono">
								{material.sku}
							</Badge>
						</div>
						{material.description && (
							<span className="text-sm text-muted-foreground line-clamp-1">
								{material.description}
							</span>
						)}
					</div>
				)
			},
		}),
		ch.accessor((row) => row.category?.name, {
			id: 'category',
			header: 'Kategori',
			size: 140,
			enableSorting: false,
			cell: ({ row }) => (
				<Badge variant="secondary" size="sm">
					{row.original.category?.name ?? 'Tanpa Kategori'}
				</Badge>
			),
		}),
		ch.accessor('type', {
			header: 'Jenis',
			size: 160,
			enableSorting: false,
			cell: ({ row }) => <BadgeDot {...MaterialBadgeProps[row.original.type]} />,
		}),
		ch.accessor((row) => row.uom?.code, {
			id: 'uom',
			header: 'Satuan',
			size: 90,
			enableSorting: false,
			cell: ({ row }) => (
				<Badge variant="outline" size="sm" className="font-bold uppercase tracking-wider">
					{row.original.uom?.code ?? '-'}
				</Badge>
			),
		}),
		ch.accessor('locationIds', {
			header: 'Lokasi',
			size: 120,
			enableSorting: false,
			cell: ({ row }) => {
				const count = row.original.locationIds.length
				return (
					<Button
						variant="ghost"
						onClick={() => {
							void MaterialAssignToLocationDialog.call({
								materialIds: [row.original.id],
								materialName: row.original.name,
							})
						}}
					>
						<MapPinIcon />
						<span className={count === 0 ? 'text-muted-foreground' : ''}>{count} Lokasi</span>
						<PlusIcon />
					</Button>
				)
			},
		}),
		ch.accessor('updatedAt', dateColumn({ header: 'Diperbarui', size: 140 })),
		actionColumn<MaterialSelectDto>({
			id: 'action',
			size: 80,
			cell: ({ row }) => {
				const material = row.original
				return (
					<div className="flex items-center justify-end gap-1 px-2">
						<Button
							variant="ghost"
							title="Lihat Detail"
							nativeButton={false}
							render={<Link to="/material/$id" params={{ id: String(material.id) }} />}
						>
							<EyeIcon />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
								<MoreHorizontalIcon />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-40">
								{material.type === 'semi' && (
									<DropdownMenuItem
										nativeButton={false}
										render={<Link to="/material/$id/recipe" params={{ id: String(material.id) }} />}
									>
										<ChefHatIcon className="mr-2" />
										Kelola Resep
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									nativeButton={false}
									render={<Link to="/material/$id/update" params={{ id: String(material.id) }} />}
								>
									<PencilIcon className="mr-2" />
									Edit Bahan
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() => void handleDelete(material.id)}
								>
									<Trash2Icon className="mr-2" />
									Hapus
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)
			},
		}),
	]
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function MaterialTable() {
	const ds = useDataTableState<MaterialFilterDto>()
	const [rowSelection, setRowSelection] = useState({})

	// Parallel suspense fetch for filters
	const [{ data: categories }, { data: locations }] = useSuspenseQueries({
		queries: [
			materialCategoryApi.list.query({ limit: 100 }),
			locationApi.list.query({ limit: 100 }),
		],
	})

	const { data, isLoading } = useQuery(
		materialApi.list.query({ ...ds.pagination, ...ds.filters, search: ds.search }),
	)

	const deleteMutation = useMutation({ mutationFn: materialApi.remove.mutationFn })

	const handleDelete = async (id: number) => {
		await ConfirmDialog.call({
			title: 'Hapus Bahan Baku',
			description:
				'Apakah Anda yakin ingin menghapus bahan baku ini? Data yang telah digunakan dalam transaksi mungkin tidak dapat dihapus.',
			variant: 'destructive',
			confirmLabel: 'Hapus',
			onConfirm: async () => {
				const promise = deleteMutation.mutateAsync({ body: { id } })
				await toast.promise(promise, toastLabelMessage('delete', 'bahan baku')).unwrap()
			},
		})
	}

	// oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
	const columns = useMemo(() => getColumns(handleDelete), [handleDelete])

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
		state: { rowSelection },
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		getRowId: (row) => String(row.id),
	})

	const selectedRows = isLoading ? [] : table.getFilteredSelectedRowModel().flatRows
	const selectedIds = selectedRows.map((row) => row.original.id)

	return (
		<DataTableCard
			title="Daftar Bahan Baku"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
			toolbar={
				<DataGridFilter
					ds={ds}
					options={[
						{ type: 'search', placeholder: 'Cari bahan baku...' },
						{
							type: 'select',
							key: 'type',
							placeholder: 'Semua Jenis',
							options: [
								{ label: 'Raw', value: 'raw' },
								{ label: 'Semi', value: 'semi' },
							],
						},
						{
							type: 'select',
							key: 'categoryId',
							placeholder: 'Semua Kategori',
							options: categories?.data.map((c) => ({ label: c.name, value: c.id })) ?? [],
						},
						{
							type: 'select',
							key: 'locationIds',
							placeholder: 'Semua Lokasi',
							options: locations?.data.map((l) => ({ label: l.name, value: l.id })) ?? [],
						},
					]}
				/>
			}
			action={
				<div className="flex items-center gap-2">
					{selectedIds.length > 0 && (
						<Button
							variant="outline"
							onClick={() => {
								void MaterialAssignToLocationDialog.call({
									materialIds: selectedIds,
									materialName: `${selectedIds.length} Bahan Baku`,
								})
							}}
						>
							<MapPinIcon />
							Tugaskan {selectedIds.length} Lokasi
						</Button>
					)}
					<Button nativeButton={false} render={<Link to="/material/create" />}>
						Tambah Bahan Baku
					</Button>
				</div>
			}
		/>
	)
}
