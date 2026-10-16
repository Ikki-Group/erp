import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react'

import { listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { createActionColumn } from '@/components/shared/action-column'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'

import { locationResource } from '@/features/location/api'
import { locationColumns } from '@/features/location/components/location-table'
import { LOCATION_TYPE_OPTIONS, LocationTypeEnum } from '@/features/location/dto'
import type { LocationDto } from '@/features/location/dto'
import { useLocationDelete } from '@/features/location/use-location-delete'

const searchSchema = listSearchSchema.extend({
	type: LocationTypeEnum.optional(),
})

export const Route = createFileRoute('/_authenticated/settings/locations/')({
	validateSearch: searchSchema,
	component: LocationsPage,
})

function LocationsPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const canCreate = usePermissionCheck({ permission: 'location.create' })
	const canEdit = usePermissionCheck({ permission: 'location.update' })
	const { run: handleDelete, isPending: deleting, canDelete } = useLocationDelete()

	const listQuery = useQuery({
		...locationResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			type: search.type,
		}),
		throwOnError: false,
	})

	const actionsColumn = useMemo(
		() =>
			createActionColumn<LocationDto>({
				// oxlint-disable-next-line react/no-unstable-nested-components
				getItems: (location) => [
					canEdit && {
						label: 'Edit',
						icon: <EditIcon className="size-4" />,
						onClick: () =>
							navigate({
								to: '/settings/locations/$locationId/edit',
								params: { locationId: String(location.id) },
							}),
					},
					canDelete && {
						label: 'Deactivate',
						icon: <TrashIcon className="size-4" />,
						onClick: () => handleDelete(location),
						variant: 'destructive' as const,
						disabled: deleting,
					},
				],
			}),
		[canEdit, canDelete, deleting, handleDelete, navigate],
	)

	const columns = useMemo(
		() => [...locationColumns, actionsColumn] as ColumnDef<DataGridFeatures, LocationDto>[],
		[actionsColumn],
	)
	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.type !== undefined,
	})

	return (
		<EntityListPage
			title="Locations"
			description="Manage active stores and warehouses."
			list={list}
			createAction={
				canCreate && (
					<Button size="sm" onClick={() => navigate({ to: '/settings/locations/new' })}>
						<PlusIcon className="size-4" />
						Add Location
					</Button>
				)
			}
			emptyState={{
				title: 'No active locations',
				description: 'Add a store or warehouse for your team to use.',
			}}
			emptyMessage="No locations match your filters."
			onRowClick={(location) =>
				navigate({
					to: '/settings/locations/$locationId',
					params: { locationId: String(location.id) },
				})
			}
			toolbar={
				<TableToolbar
					searchValue={list.globalFilter}
					onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
					searchPlaceholder="Search locations..."
					filters={[
						{
							key: 'type',
							label: 'Type',
							value: search.type,
							onChange: (value) =>
								list.setFilters({ type: value ? LocationTypeEnum.parse(value) : undefined }),
							options: LOCATION_TYPE_OPTIONS,
							allLabel: 'All types',
						},
					]}
				/>
			}
		/>
	)
}
