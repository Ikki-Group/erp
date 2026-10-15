import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'

import { Building2Icon, PlusIcon, WarehouseIcon, EditIcon, TrashIcon } from 'lucide-react'

import { DataTable, listSearchSchema, TextCell, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import { StatusBadge } from '@/components/shared/status-badge'
import { createActionColumn } from '@/components/shared/action-column'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { confirm } from '@/components/shared/confirm'
import { toast } from '@/components/ui/toast'

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

const EDIT_ICON = <EditIcon className="size-4" />
const DELETE_ICON = <TrashIcon className="size-4" />

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
	const canCreate = usePermissionCheck({ permission: 'location.create' })
	const canEdit = usePermissionCheck({ permission: 'location.update' })
	const canDelete = usePermissionCheck({ permission: 'location.delete' })

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

const handleDelete = async (location: LocationDto) => {
	await confirm({
		title: 'Delete location?',
		description: `This will permanently delete "${location.name}". This action cannot be undone.`,
		confirmLabel: 'Delete',
		variant: 'destructive',
		onConfirm: async () => {
			await locationResource.remove.fetch({ id: location.id })
			toast.add({ title: 'Location deleted successfully.', type: 'success' })
		},
	})
}

const actionsColumn = useMemo(
	() =>
		createActionColumn<LocationDto>({
			getItems: (location) => [
				canEdit && {
					label: 'Edit',
					icon: EDIT_ICON,
					onClick: () =>
						navigate({
							to: '/settings/locations/$locationId/edit',
							params: { locationId: String(location.id) },
						}),
				},
				canDelete && {
					label: 'Delete',
					icon: DELETE_ICON,
					onClick: () => handleDelete(location),
					variant: 'destructive' as const,
				},
			],
		}),
	[canEdit, canDelete, handleDelete, navigate],
)

const allColumns = useMemo(
	() => [...columns, actionsColumn] as ColumnDef<DataGridFeatures, LocationDto>[],
	[actionsColumn],
)

	const { table } = useServerTable({
	data,
	columns: allColumns,
	totalCount,
	search,
	onSearchChange: (next) => navigate({ search: next }),
})

	return (
		<div className="space-y-6">
			<PageHeader
				title="Locations"
				description="Manage stores and warehouses."
				actions={
					canCreate && (
						<Button size="sm" onClick={() => navigate({ to: '/settings/locations/new' })}>
							<PlusIcon className="size-4" />
							Add Location
						</Button>
					)
				}
			/>

			<DataTable
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isLoading}
			emptyMessage="No locations found."
			onRowClick={(location) => navigate({
				to: '/settings/locations/$locationId',
				params: { locationId: String(location.id) },
			})}
		/>
	</div>
)
}
