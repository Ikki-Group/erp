import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ArrowLeftIcon, MapPinIcon, PencilIcon, TrashIcon } from 'lucide-react'

import { DataTable, useResourceList } from '@/components/data-table'
import {
	AuditInfo,
	DetailBoundary,
	DetailList,
	DetailPage,
	DetailSection,
	StatusBadge,
} from '@/components/shared'
import { InlineAlert } from '@/components/shared/inline-alert'
import { PageError } from '@/components/shared/page-error'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'

import { userResource } from '@/features/iam/api'
import {
	LOCATION_STAFF_STATUS_OPTIONS,
	locationStaffColumns,
	locationStaffSearchSchema,
	parseLocationStaffStatus,
} from '@/features/iam/components/location-staff-columns'
import { locationResource } from '@/features/location/api'
import type { LocationDto } from '@/features/location/dto'
import { useLocationDelete } from '@/features/location/use-location-delete'

export const Route = createFileRoute('/_authenticated/settings/locations/$locationId/')({
	validateSearch: locationStaffSearchSchema,
	component: LocationDetailRoute,
})

function LocationDetailRoute() {
	const { locationId } = Route.useParams()
	const navigate = useNavigate({ from: Route.fullPath })
	const canRead = usePermissionCheck({ permission: 'location.read' })

	const detailQuery = useQuery({
		...locationResource.detail.queryOptions({ id: Number(locationId) }),
		enabled: canRead,
		refetchOnWindowFocus: false,
		throwOnError: false,
	})

	if (!canRead) {
		return (
			<PageError
				title="Access denied"
				message="You do not have permission to view location details."
			/>
		)
	}

	return (
		<DetailBoundary
			query={detailQuery}
			error={renderLocationError}
			notFound={
				<div className="flex h-96 flex-col items-center justify-center gap-4">
					<MapPinIcon className="size-12 text-muted-foreground" />
					<p className="text-muted-foreground">Location not found</p>
					<Button variant="outline" onClick={() => navigate({ to: '/settings/locations' })}>
						<ArrowLeftIcon className="size-4" />
						Back to Locations
					</Button>
				</div>
			}
		>
			{(response) => <LocationDetail key={response.data.id} location={response.data} />}
		</DetailBoundary>
	)
}

function renderLocationError(_error: Error, retry: () => void) {
	return <PageError title="Could not load location" onRetry={retry} />
}

function LocationDetail({ location }: { location: LocationDto }) {
	const navigate = useNavigate({ from: Route.fullPath })
	const canEdit = usePermissionCheck({ permission: 'location.update' })
	const deletion = useLocationDelete({ onDeleted: () => navigate({ to: '/settings/locations' }) })

	return (
		<DetailPage
			title={location.name}
			description={`Code: ${location.code}`}
			status={
				<StatusBadge variant={location.isActive ? 'success' : 'default'}>
					{location.isActive ? 'Active' : 'Inactive'}
				</StatusBadge>
			}
			actions={
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigate({ to: '/settings/locations' })}
					>
						<ArrowLeftIcon className="size-4" />
						Back
					</Button>
					{deletion.canDelete && (
						<Button
							variant="outline"
							size="sm"
							disabled={deletion.isPending}
							onClick={() => void deletion.run(location)}
						>
							<TrashIcon className="size-4" />
							Deactivate
						</Button>
					)}
					{canEdit && (
						<Button
							size="sm"
							onClick={() =>
								navigate({
									to: '/settings/locations/$locationId/edit',
									params: { locationId: String(location.id) },
								})
							}
						>
							<PencilIcon className="size-4" />
							Edit
						</Button>
					)}
				</div>
			}
		>
			<DetailSection title="Location Details">
				<DetailList
					items={[
						{ label: 'Type', value: location.type === 'store' ? 'Store' : 'Warehouse' },
						{ label: 'Address', value: location.address || '-' },
						{ label: 'Phone', value: location.phone || '-' },
					]}
					columns={2}
				/>
				<AuditInfo createdAt={location.createdAt} createdBy={location.createdBy} />
			</DetailSection>

			<AssignedUsersSection locationId={location.id} />
		</DetailPage>
	)
}

/** Reads staff for this route's location explicitly; the header location is irrelevant here. */
function AssignedUsersSection({ locationId }: { locationId: number }) {
	const canReadUsers = usePermissionCheck({ permission: 'iam.read' })

	return (
		<DetailSection title="Assigned Users">
			{canReadUsers ? (
				<AssignedUsersTable key={locationId} locationId={locationId} />
			) : (
				<InlineAlert variant="info" title="Assigned users are not available">
					<p>You need permission to view users and roles to see who is assigned here.</p>
				</InlineAlert>
			)}
		</DetailSection>
	)
}

function AssignedUsersTable({ locationId }: { locationId: number }) {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })

	const usersQuery = useQuery({
		...userResource.byLocation.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive,
			locationId,
		}),
		throwOnError: false,
	})

	const list = useResourceList({
		query: usersQuery,
		columns: locationStaffColumns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.isActive !== undefined,
	})

	const toolbar = (
		<TableToolbar
			searchValue={list.globalFilter}
			onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
			searchPlaceholder="Search assigned users..."
			filters={[
				{
					key: 'isActive',
					label: 'Status',
					value: search.isActive === undefined ? undefined : String(search.isActive),
					onChange: (value) => list.setFilters({ isActive: parseLocationStaffStatus(value) }),
					options: LOCATION_STAFF_STATUS_OPTIONS,
					allLabel: 'All Statuses',
				},
			]}
		/>
	)

	if (list.state === 'initial-error') {
		return (
			<div className="space-y-4">
				{toolbar}
				<PageError title="Could not load assigned users" onRetry={list.retry} />
			</div>
		)
	}

	return (
		<div className="min-w-0 space-y-4" aria-busy={list.isRefreshing}>
			{list.state === 'refresh-error' && (
				<InlineAlert variant="warning" title="Could not refresh assigned users">
					<p>Showing the last loaded results.</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={list.isRefreshing}
						onClick={list.retry}
					>
						Retry
					</Button>
				</InlineAlert>
			)}
			<DataTable
				table={list.table}
				recordCount={list.recordCount}
				isLoading={list.state === 'initial-loading'}
				emptyMessage={
					list.state === 'record-empty'
						? 'No users assigned to this location.'
						: 'No assigned users match your search.'
				}
				toolbar={toolbar}
			/>
		</div>
	)
}
