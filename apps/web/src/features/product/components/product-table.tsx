import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import {
	actionColumn,
	createColumnHelper,
	currencyColumn,
	dateColumn,
	statusColumn,
	textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { locationApi } from '@/features/location'
import { productApi, productCategoryApi } from '@/features/product/api'
import type { ProductFilterDto, ProductSelectDto } from '@/features/product/dto'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { PencilIcon, PlusIcon } from 'lucide-react'

const ch = createColumnHelper<ProductSelectDto>()

const columns = [
	ch.accessor('sku', textColumn({ header: 'SKU', size: 140 })),
	ch.accessor(
		'name',
		statusColumn({
			header: 'Nama Produk',
			render: (value, row) => (
				<div className="flex flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<span className="font-medium text-sm">{value}</span>
						{row.externalMappings.some((m) => m.provider === 'moka') && (
							<Badge
								variant="outline"
								className="h-4 px-1 text-[10px] bg-orange-50 text-orange-600 border-orange-200"
							>
								MOKA
							</Badge>
						)}
					</div>
					<span className="text-xs text-muted-foreground">
						{row.category?.name ?? 'Tanpa Kategori'}
					</span>
				</div>
			),
			size: 300,
		}),
	),
	ch.accessor('basePrice', currencyColumn({ header: 'Harga', size: 120 })),
	ch.accessor(
		'status',
		statusColumn({
			header: 'Status',
			render: (value) => {
				const status = value as string
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
			size: 100,
		}),
	),
	ch.accessor(
		'variants',
		statusColumn({
			header: 'Varian',
			render: (_, row) =>
				row.hasVariants ? (
					<span className="text-sm font-medium">{row.variants.length} Varian</span>
				) : (
					<span className="text-xs text-muted-foreground">-</span>
				),
			size: 100,
		}),
	),
	ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 160 })),
	ch.display(
		actionColumn<ProductSelectDto>({
			id: 'action',
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
		}),
	),
]

export function ProductTable() {
	const ds = useDataTableState<ProductFilterDto>()

	const { data: categories } = useQuery(productCategoryApi.list.query({ limit: 100 }))
	const { data: locations } = useQuery(locationApi.list.query({ limit: 100 }))

	const { data, isLoading } = useQuery(
		productApi.list.query({ ...ds.pagination, ...ds.filters, q: ds.search }),
	)

	const table = useDataTable({
		columns: columns,
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
