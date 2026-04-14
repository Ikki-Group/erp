// oxlint-disable max-lines
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import {
	ChefHatIcon,
	EyeIcon,
	MapPinIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { createColumnHelper, dateColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { locationApi } from '@/features/location'
import type { MaterialFilterDto, MaterialSelectDto } from '@/features/material'
import {
	MaterialAssignToLocationDialog,
	MaterialBadgeProps,
	materialApi,
} from '@/features/material'
import { materialCategoryApi } from '@/features/material/api/material-category.api'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { toastLabelMessage } from '@/lib/toast-message'
import { cn } from '@/lib/utils'

const ch = createColumnHelper<MaterialSelectDto>()

export const Route = createFileRoute('/_app/material/')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page>
			<Page.BlockHeader
				title="Bahan Baku"
				description="Kelola daftar bahan mentah dan bahan setengah jadi untuk proses produksi, pengaturan satuan (UOM), serta penempatan lokasi penyimpanan."
			/>
			<Page.Content>
				<MaterialTable />
			</Page.Content>
		</Page>
	)
}

function MaterialTable() {
	const ds = useDataTableState<MaterialFilterDto>()
	const [rowSelection, setRowSelection] = useState({})

	const { data: categories } = useSuspenseQuery(materialCategoryApi.list.query({ limit: 100 }))

	const { data: locations } = useSuspenseQuery(locationApi.list.query({ limit: 100 }))

	const { data, isLoading } = useQuery(
		materialApi.list.query({ ...ds.pagination, ...ds.filters, q: ds.search }),
	)

	const deleteMutation = useMutation({ mutationFn: materialApi.remove.mutationFn })

	const handleDelete = async (id: number) => {
		const promise = deleteMutation.mutateAsync({ body: { id } })
		await toast.promise(promise, toastLabelMessage('delete', 'bahan baku')).unwrap()
	}

	// oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
	const columns = useMemo(() => getColumns(handleDelete), [handleDelete])
	const table = useDataTable({
		columns: columns,
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
		<>
			<MaterialAssignToLocationDialog.Root />
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
								<MapPinIcon />
								Assign {selectedIds.length} Lokasi
							</Button>
						)}
						<Button
							size="sm"
							nativeButton={false}
							render={<Link from={Route.fullPath} to="/material/create" />}
						>
							Tambah Bahan Baku
						</Button>
					</div>
				}
			/>
		</>
	)
}

function getColumns(
	handleDelete: (id: number) => Promise<void>,
): ColumnDef<MaterialSelectDto, any>[] {
	return [
		ch.display({
			id: 'select',
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }: CellContext<MaterialSelectDto, any>) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
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
			cell: ({ row }: CellContext<MaterialSelectDto, any>) => {
				const value = row.original.name
				return (
					<div className="flex flex-col gap-1.5 py-1">
						<div className="flex items-center gap-2">
							<Link
								from={Route.fullPath}
								to="/material/$id"
								params={{ id: String(row.original.id) }}
								className="font-semibold text-sm tracking-tight hover:text-primary hover:underline"
							>
								{value}
							</Link>
							<span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50 font-medium">
								{row.original.sku}
							</span>
						</div>
						{row.original.description && (
							<span className="text-xs text-muted-foreground/80 line-clamp-1 max-w-[300px]">
								{row.original.description}
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
			cell: ({ row }: CellContext<MaterialSelectDto, any>) => (
				<Badge
					variant="secondary"
					className="bg-secondary/40 text-secondary-foreground rounded-md px-2 py-0 border-none font-medium text-[11px]"
				>
					{row.original.category?.name ?? 'Uncategorized'}
				</Badge>
			),
		}),
		ch.accessor('type', {
			header: 'Jenis',
			size: 160,
			enableSorting: false,
			cell: ({ row }: CellContext<MaterialSelectDto, any>) => (
				<BadgeDot {...MaterialBadgeProps[row.original.type]} />
			),
		}),
		ch.accessor((row) => row.uom?.code, {
			id: 'uom',
			header: 'Satuan',
			size: 90,
			enableSorting: false,
			cell: ({ row }: CellContext<MaterialSelectDto, any>) => (
				<div className="flex items-center">
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
			cell: ({ row }: CellContext<MaterialSelectDto, any>) => {
				const count = row.original.locationIds.length
				return (
					<Button
						variant="ghost"
						size="sm"
						className="gap-2 -ml-2"
						onClick={() => {
							void MaterialAssignToLocationDialog.call({
								materialIds: [row.original.id],
								materialName: row.original.name,
							})
						}}
					>
						<MapPinIcon className="size-3.5 text-muted-foreground" />
						<span
							className={cn('text-nowrap', count > 0 ? 'text-sm' : 'text-sm text-muted-foreground')}
						>
							{count} Lokasi
						</span>
						<PlusIcon className="size-3 text-muted-foreground/50" />
					</Button>
				)
			},
		}),
		ch.accessor('updatedAt', dateColumn({ header: 'Diperbarui', size: 140 })),
		ch.display({
			id: 'action',
			size: 140,
			cell: ({ row }: CellContext<MaterialSelectDto, any>) => {
				return (
					<div className="flex items-center justify-end gap-1 px-2">
						<Button
							variant="ghost"
							size="icon-sm"
							className="size-8 text-muted-foreground hover:text-foreground"
							title="Lihat Detail"
							nativeButton={false}
							render={
								<Link
									from={Route.fullPath}
									to="/material/$id"
									params={{ id: String(row.original.id) }}
								/>
							}
						>
							<EyeIcon className="size-4" />
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
								<MoreHorizontalIcon className="size-4" />
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{row.original.type === 'semi' && (
									<DropdownMenuItem
										nativeButton={false}
										render={
											<Link
												from={Route.fullPath}
												to="/material/$id/recipe"
												params={{ id: String(row.original.id) }}
											/>
										}
									>
										<ChefHatIcon className="mr-2 size-4" />
										Kelola Resep
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									nativeButton={false}
									render={
										<Link
											from={Route.fullPath}
											to="/material/$id/update"
											params={{ id: String(row.original.id) }}
										/>
									}
								>
									<PencilIcon className="mr-2 size-4" />
									Edit Bahan
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() => void handleDelete(row.original.id)}
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
