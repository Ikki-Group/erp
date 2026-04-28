import { useMemo, useState } from 'react'

import { useMutation, useQuery, useSuspenseQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

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
import { cn } from '@/lib/utils'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Badge } from '@/components/reui/badge'
import { createColumnHelper, dateColumn } from '@/components/reui/data-grid/data-grid-columns'
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

function getColumns(
	handleDelete: (id: number) => Promise<void>,
): ColumnDef<MaterialSelectDto, any>[] {
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
					<div className="flex flex-col justify-center min-h-10 py-1">
						<div className="flex items-center gap-2">
							<Link
								to="/material/$id"
								params={{ id: String(material.id) }}
								className="font-semibold text-sm tracking-tight hover:text-primary hover:underline"
							>
								{material.name}
							</Link>
							<span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 font-medium">
								{material.sku}
							</span>
						</div>
						{material.description && (
							<span className="text-[11px] text-muted-foreground/60 line-clamp-1 max-w-75 h-4 leading-relaxed">
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
				<div className="flex items-center min-h-10">
					<Badge
						variant="secondary"
						className="bg-secondary/40 text-secondary-foreground rounded-md px-2 py-0 border-none font-medium text-[11px]"
					>
						{row.original.category?.name ?? 'Tanpa Kategori'}
					</Badge>
				</div>
			),
		}),
		ch.accessor('type', {
			header: 'Jenis',
			size: 160,
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center min-h-10">
					<BadgeDot {...MaterialBadgeProps[row.original.type]} />
				</div>
			),
		}),
		ch.accessor((row) => row.uom?.code, {
			id: 'uom',
			header: 'Satuan',
			size: 90,
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center min-h-10">
					<Badge
						variant="outline"
						className="h-5 rounded-full px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 border-muted-foreground/20"
					>
						{row.original.uom?.code ?? '-'}
					</Badge>
				</div>
			),
		}),
		ch.accessor('locationIds', {
			header: 'Lokasi',
			size: 120,
			enableSorting: false,
			cell: ({ row }) => {
				const count = row.original.locationIds.length
				return (
					<div className="flex items-center min-h-10">
						<Button
							variant="ghost"
							size="sm"
							className="gap-2 -ml-2 h-8"
							onClick={() => {
								void MaterialAssignToLocationDialog.call({
									materialIds: [row.original.id],
									materialName: row.original.name,
								})
							}}
						>
							<MapPinIcon className="size-3.5 text-muted-foreground" />
							<span
								className={cn(
									'text-nowrap',
									count > 0 ? 'text-sm' : 'text-sm text-muted-foreground',
								)}
							>
								{count} Lokasi
							</span>
							<PlusIcon className="size-3 text-muted-foreground/50" />
						</Button>
					</div>
				)
			},
		}),
		ch.accessor('updatedAt', dateColumn({ header: 'Diperbarui', size: 140 })),
		ch.display({
			id: 'action',
			size: 140,
			cell: ({ row }) => {
				const material = row.original
				return (
					<div className="flex items-center justify-end gap-1 px-2 min-h-10">
						<Button
							variant="ghost"
							size="icon-sm"
							className="size-8 text-muted-foreground hover:text-foreground"
							title="Lihat Detail"
							nativeButton={false}
							render={<Link to="/material/$id" params={{ id: String(material.id) }} />}
						>
							<EyeIcon className="size-4" />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
								<MoreHorizontalIcon className="size-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{material.type === 'semi' && (
									<DropdownMenuItem
										nativeButton={false}
										render={<Link to="/material/$id/recipe" params={{ id: String(material.id) }} />}
									>
										<ChefHatIcon className="mr-2 size-4" />
										Kelola Resep
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									nativeButton={false}
									render={<Link to="/material/$id/update" params={{ id: String(material.id) }} />}
								>
									<PencilIcon className="mr-2 size-4" />
									Edit Bahan
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() => void handleDelete(material.id)}
								>
									<Trash2Icon className="mr-2 size-4" />
									Hapus
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)
			},
			enablePinning: true,
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
		materialApi.list.query({ ...ds.pagination, ...ds.filters, q: ds.search }),
	)

	const deleteMutation = useMutation({
		mutationFn: materialApi.remove.mutationFn,
		onSuccess: () => {
			// Optional: Invalidate queries if needed, though toast usually handles feedback
		},
	})

	const handleDelete = async (id: number) => {
		const promise = deleteMutation.mutateAsync({ body: { id } })
		await toast.promise(promise, toastLabelMessage('delete', 'bahan baku')).unwrap()
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
							size="sm"
							onClick={() => {
								void MaterialAssignToLocationDialog.call({
									materialIds: selectedIds,
									materialName: `${selectedIds.length} Bahan Baku`,
								})
							}}
						>
							<MapPinIcon className="size-3.5" />
							Assign {selectedIds.length} Lokasi
						</Button>
					)}
					<Button size="sm" nativeButton={false} render={<Link to="/material/create" />}>
						Tambah Bahan Baku
					</Button>
				</div>
			}
		/>
	)
}
