import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'

import { Building2Icon, MapPinIcon, PlusIcon, WarehouseIcon } from 'lucide-react'

import { DataTable, listSearchSchema, TextCell, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { Button } from '@/components/ui/button'
import { PageHeader, StatCard } from '@/components/shared'
import { StatusBadge } from '@/components/shared/status-badge'

import { locationResource } from '@/features/location/api'
import type { LocationDto } from '@/features/location/dto'

const searchSchema = listSearchSchema.extend({
	type: z.enum(['store', 'warehouse']).optional(),
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})

export const Route = createFileRoute('/_authenticated/settings/locations/')({
	validateSearch: searchSchema,
	component: LocationsPage,
})

const col = createColumnHelper<DataGridFeatures, LocationDto>()

const columns = [
	col.accessor('code', {
		header: 'Code',
		size: 120,
		cell: ({ getValue }) => <TextCell value={getValue()} mono muted />,
	}),
	col.accessor('name', {
		header: 'Name',
		size: 200,
		cell: ({ getValue }) => <TextCell value={getValue()} truncate />,
	}),
	col.accessor('type', {
		header: 'Type',
		size: 120,
		cell: ({ getValue }) => {
			const type = getValue()
			const Icon = type === 'store' ? Building2Icon : WarehouseIcon
			return (
				<div className="flex items-center gap-1.5">
					<Icon className="size-3.5 text-muted-foreground" />
					<span className="text-sm">{type === 'store' ? 'Store' : 'Warehouse'}</span>
				</div>
			)
		},
	}),
	col.accessor('address', {
		header: 'Address',
		size: 250,
		cell: ({ getValue }) => <TextCell value={getValue()} truncate muted />,
	}),
	col.accessor('phone', {
		header: 'Phone',
		size: 150,
		cell: ({ getValue }) => <TextCell value={getValue()} muted />,
	}),
	col.accessor('isActive', {
		header: 'Status',
		size: 100,
		cell: ({ getValue }) => (
			<StatusBadge variant={getValue() ? 'success' : 'default'}>
				{getValue() ? 'Active' : 'Inactive'}
			</StatusBadge>
		),
	}),
]

function LocationsPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })

	const listQuery = useQuery(
		locationResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			type: search.type,
		}),
	)

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const { table, globalFilter } = useServerTable({
		data,
		columns: useMemo(
			() => columns as ColumnDef<DataGridFeatures, LocationDto>[],
			[],
		),
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	const stores = useMemo(() => data.filter((l) => l.type === 'store').length, [data])
	const warehouses = useMemo(() => data.filter((l) => l.type === 'warehouse').length, [data])

	const stats = useMemo(
		() => (
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					title="Total Locations"
					value={totalCount}
					icon={<MapPinIcon className="size-4" />}
					description="All locations"
					isLoading={listQuery.isLoading}
				/>
				<StatCard
					title="Stores"
					value={stores}
					icon={<Building2Icon className="size-4" />}
					description="Retail locations"
					isLoading={listQuery.isLoading}
				/>
				<StatCard
					title="Warehouses"
					value={warehouses}
					icon={<WarehouseIcon className="size-4" />}
					description="Storage locations"
					isLoading={listQuery.isLoading}
				/>
			</div>
		),
		[totalCount, stores, warehouses, listQuery.isLoading],
	)

	return (
		<div className="space-y-6">
			<PageHeader
				title="Locations"
				description="Manage stores and warehouses."
				actions={
					<Button size="sm" onClick={() => navigate({ to: '/settings/locations/new' })}>
						<PlusIcon className="size-4" />
						Add Location
					</Button>
				}
			/>

			{stats}

			<DataTable
				table={table}
				recordCount={totalCount}
				isLoading={listQuery.isLoading}
				isEmpty={!listQuery.isLoading && data.length === 0 && !globalFilter}
				emptyMessage="No locations found."
				onRowClick={(row: LocationDto) =>
					navigate({
						to: '/settings/locations/$locationId',
						params: { locationId: String(row.id) },
					})
				}
			/>
		</div>
	)
}
