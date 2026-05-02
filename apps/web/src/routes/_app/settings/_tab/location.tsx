import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { EyeIcon, MoreHorizontalIcon, PencilIcon, StoreIcon, WarehouseIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot, getActiveStatusBadge } from '@/components/blocks/data-display/badge-dot'
import { Badge } from '@/components/reui/badge'
import {
	actionColumn,
	createColumnHelper,
	dateColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { LocationDto } from '@/features/location'
import { locationApi } from '@/features/location'
import type { LocationTypeDto } from '@/features/location/dto'

export const Route = createFileRoute('/_app/settings/_tab/location')({
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<div className="space-y-4">
			<LocationsTable />
		</div>
	)
}

const ch = createColumnHelper<LocationDto>()
const columns = [
	ch.accessor('name', {
		header: 'Lokasi',
		size: 400,
		cell: ({ row }) => {
			const { name, code, type, address, phone } = row.original
			return (
				<div className="flex gap-3 items-start py-0.5">
					<div className="mt-0.5 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
						{type === 'store' ? (
							<StoreIcon className="text-info size-4" />
						) : (
							<WarehouseIcon className="text-warning-foreground size-4" />
						)}
					</div>
					<div className="flex flex-col gap-0.5 min-w-0">
						<div className="flex items-center gap-2">
							<p className="font-semibold text-foreground truncate">{name}</p>
							<span className="text-[10px] font-mono text-muted-foreground bg-muted hover:bg-muted-foreground/10 px-1.5 py-0.5 rounded uppercase tracking-wider transition-colors">
								{code}
							</span>
						</div>
						{(address ?? phone) && (
							<div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 truncate">
								{address && <p className="truncate max-w-70">{address}</p>}
								{address && phone && <span className="size-1 rounded-full bg-border shrink-0" />}
								{phone && <p className="shrink-0">{phone}</p>}
							</div>
						)}
					</div>
				</div>
			)
		},
	}),
	ch.accessor('type', {
		header: 'Tipe',
		size: 130,
		cell: ({ getValue }) => {
			const val = getValue()
			if (val === 'store') {
				return (
					<Badge variant="info-outline" size="sm" className="font-medium">
						Store
					</Badge>
				)
			}
			return (
				<Badge variant="warning-outline" size="sm" className="font-medium">
					Warehouse
				</Badge>
			)
		},
	}),
	ch.accessor('isActive', {
		header: 'Status',
		size: 120,
		cell: ({ getValue }) => {
			return <BadgeDot {...getActiveStatusBadge(getValue())} size="sm" />
		},
	}),
	ch.accessor('createdAt', dateColumn({ header: 'Pendaftaran', size: 160 })),
	actionColumn<LocationDto>({
		id: 'action',
		size: 60,
		cell: ({ row }) => {
			return (
				<div className="flex items-center justify-end px-2">
					<DropdownMenu>
						<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
							<MoreHorizontalIcon />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-36">
							<DropdownMenuItem
								nativeButton={false}
								render={<Link to="/location/$id" params={{ id: String(row.original.id) }} />}
							>
								<EyeIcon className="mr-2" />
								Detail
							</DropdownMenuItem>
							<DropdownMenuItem
								nativeButton={false}
								render={<Link to="/location/$id/edit" params={{ id: String(row.original.id) }} />}
							>
								<PencilIcon className="mr-2" />
								Edit
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)
		},
	}),
]

function LocationsTable() {
	const ds = useDataTableState<{ isActive?: boolean; type?: LocationTypeDto }>()
	const { data, isLoading } = useQuery(
		locationApi.list.query({ ...ds.pagination, q: ds.search, ...ds.filters }),
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
			title="Daftar Lokasi"
			table={table}
			isLoading={isLoading}
			recordCount={data?.meta.total ?? 0}
			toolbar={
				<DataGridFilter
					ds={ds}
					options={[
						{ type: 'search', placeholder: 'Cari lokasi (nama, kode)...' },
						{
							type: 'select',
							key: 'type',
							placeholder: 'Tipe',
							options: [
								{ label: 'Semua Tipe', value: '' },
								{ label: 'Store', value: 'store' },
								{ label: 'Warehouse', value: 'warehouse' },
							],
						},
						{
							type: 'select',
							key: 'isActive',
							placeholder: 'Status',
							options: [
								{ label: 'Semua Status', value: '' },
								{ label: 'Aktif', value: 'true' },
								{ label: 'Non-Aktif', value: 'false' },
							],
						},
					]}
				/>
			}
			action={
				<Button
					size="sm"
					render={<Link from={Route.fullPath} to="/location/create" />}
					nativeButton={false}
				>
					Tambah Lokasi
				</Button>
			}
		/>
	)
}
