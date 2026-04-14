import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot, getActiveStatusBadge } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import {
	actionColumn,
	createColumnHelper,
	dateColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'

import type { LocationDto } from '@/features/location'
import { locationApi } from '@/features/location'
import type { LocationTypeDto } from '@/features/location/dto'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import {
	Building2Icon,
	InfoIcon,
	MapPinIcon,
	PencilIcon,
	StoreIcon,
	WarehouseIcon,
} from 'lucide-react'

export const Route = createFileRoute('/_app/location/')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page>
			<Page.BlockHeader
				title="Lokasi & Gudang"
				description="Kelola data lokasi dan gudang untuk penyimpanan inventory."
			/>
			<Page.Content>
				<LocationsTable />
			</Page.Content>
		</Page>
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
					<div className="mt-0.5 size-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
						{type === 'store' ? (
							<StoreIcon className="size-4.5 text-info" />
						) : (
							<WarehouseIcon className="size-4.5 text-warning-foreground" />
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
								{address && <p className="truncate max-w-[280px]">{address}</p>}
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
						<MapPinIcon className="mr-1 size-3" />
						Store
					</Badge>
				)
			}
			return (
				<Badge variant="warning-outline" size="sm" className="font-medium">
					<Building2Icon className="mr-1 size-3" />
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
		cell: ({ row }) => {
			return (
				<div className="flex items-center justify-end px-2 gap-2">
					<Button
						variant="outline"
						size="icon-sm"
						className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 shadow-xs"
						render={<Link to="/location/$id" params={{ id: String(row.original.id) }} />}
					>
						<InfoIcon className="size-3.5" />
					</Button>
					<Button
						variant="outline"
						size="icon-sm"
						className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 shadow-xs"
						render={<Link to="/location/$id/edit" params={{ id: String(row.original.id) }} />}
					>
						<PencilIcon className="size-3.5" />
					</Button>
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
