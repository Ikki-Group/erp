import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { PencilIcon, PlusIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Badge } from '@/components/reui/badge'
import { CellCurrency, CellDate } from '@/components/reui/data-grid/data-grid-cell'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import { locationApi } from '@/features/location'
import { productApi, productCategoryApi } from '@/features/product/api'
import type { ProductFilterDto, ProductSelectDto } from '@/features/product/dto'

const columns: ColumnDef<ProductSelectDto>[] = [
	{
		accessorKey: 'sku',
		header: 'SKU',
		size: 140,
	},
	{
		accessorKey: 'name',
		header: 'Nama Produk',
		size: 300,
		cell: ({ row }) => (
			<div className="flex flex-col gap-0.5">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm">{row.original.name}</span>
					{row.original.externalMappings.some((m) => m.provider === 'moka') && (
						<Badge
							variant="outline"
							className="h-4 px-1 text-[10px] bg-orange-50 text-orange-600 border-orange-200"
						>
							MOKA
						</Badge>
					)}
				</div>
				<span className="text-xs text-muted-foreground">
					{row.original.category?.name ?? 'Tanpa Kategori'}
				</span>
			</div>
		),
	},
	{
		accessorKey: 'basePrice',
		header: 'Harga',
		size: 120,
		cell: ({ row }) => <CellCurrency value={row.original.basePrice} />,
	},
	{
		accessorKey: 'status',
		header: 'Status',
		size: 100,
		cell: ({ row }) => {
			const status = row.original.status
			return (
				<Badge
					variant={
						status === 'active' ? 'default' : status === 'inactive' ? 'secondary' : 'destructive'
					}
				>
					{status.toUpperCase()}
				</Badge>
			)
		},
	},
	{
		accessorKey: 'variants',
		header: 'Varian',
		size: 100,
		cell: ({ row }) =>
			row.original.hasVariants ? (
				<span className="text-sm font-medium">{row.original.variants.length} Varian</span>
			) : (
				<span className="text-xs text-muted-foreground">-</span>
			),
	},
	{
		accessorKey: 'createdAt',
		header: 'Dibuat Pada',
		size: 160,
		cell: ({ row }) => <CellDate value={row.original.createdAt} />,
	},
	{
		id: 'action',
		header: '',
		size: 60,
		enableSorting: false,
		enableHiding: false,
		enableResizing: false,
		enablePinning: true,
		cell: ({ row }) => {
			return (
				<div className="flex items-center justify-end px-2">
					<Button
						variant="ghost"
						size="icon-sm"
						className="size-8 text-muted-foreground hover:text-foreground"
						render={<Link to="/product/$id" params={{ id: String(row.original.id) }} />}
					>
						<PencilIcon className="size-4" />
					</Button>
				</div>
			)
		},
	},
]

export function ProductTable() {
	const ds = useDataTableState<ProductFilterDto>()

	const { data: categories } = useQuery(productCategoryApi.list.query({ limit: 100 }))
	const { data: locations } = useQuery(locationApi.list.query({ limit: 100 }))

	const { data, isLoading } = useQuery(
		productApi.list.query({ ...ds.pagination, ...ds.filters, q: ds.search }),
	)

	const table = useDataTable({
		columns,
		data: data?.data ?? [],
		pageCount: data?.meta.totalPages ?? 0,
		rowCount: data?.meta.total ?? 0,
		ds,
	})

	return (
		<DataTableCard
			title="Daftar Produk"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
			toolbar={
				<DataGridFilter
					ds={ds}
					options={[
						{ type: 'search', placeholder: 'Cari produk...' },
						{
							type: 'select',
							key: 'status',
							placeholder: 'Semua Status',
							options: [
								{ label: 'Aktif', value: 'active' },
								{ label: 'Non-Aktif', value: 'inactive' },
								{ label: 'Arsip', value: 'archived' },
							],
						},
						{
							type: 'select',
							key: 'isExternal',
							placeholder: 'Semua Tipe',
							options: [
								{ label: 'Internal Only', value: 'false' },
								{ label: 'Moka/External Only', value: 'true' },
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
							key: 'locationId',
							placeholder: 'Semua Lokasi',
							options: locations?.data.map((l) => ({ label: l.name, value: l.id })) ?? [],
						},
					]}
				/>
			}
			action={
				<Button size="sm" render={<Link to="/product/create" />}>
					<PlusIcon className="mr-2 size-4" />
					Tambah Produk
				</Button>
			}
		/>
	)
}
