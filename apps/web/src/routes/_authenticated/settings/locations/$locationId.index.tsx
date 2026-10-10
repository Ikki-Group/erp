import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowLeftIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { z } from 'zod'

import { DataTable, listSearchSchema, TextCell, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import {
	ActionMenu,
	AuditInfo,
	DetailBoundary,
	DetailList,
	DetailPage,
	DetailSection,
	StatusBadge,
	usePermissionCheck,
} from '@/components/shared'
import { confirm } from '@/components/shared/confirm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { userResource } from '@/features/iam/api'
import { locationResource } from '@/features/location/api'
import type { LocationDto } from '@/features/location/dto'

const searchSchema = listSearchSchema.extend({
	tab: z.enum(['users', 'details']).optional().default('users'),
})

export const Route = createFileRoute('/_authenticated/settings/locations/$locationId/')({
	validateSearch: searchSchema,
	component: LocationDetailPage,
})

type AssignedUser = {
	id: number
	name: string
	username: string
	email: string
	roleName: string
	isActive: boolean
}

const col = createColumnHelper<DataGridFeatures, AssignedUser>()

const columns = [
	col.accessor('name', {
		header: 'Name',
		size: 200,
		cell: ({ getValue }) => <TextCell value={getValue()} truncate />,
	}),
	col.accessor('username', {
		header: 'Username',
		size: 160,
		cell: ({ getValue }) => <TextCell value={getValue()} mono muted />,
	}),
	col.accessor('email', {
		header: 'Email',
		size: 220,
		cell: ({ getValue }) => <TextCell value={getValue()} truncate />,
	}),
	col.accessor('roleName', {
		header: 'Role',
		size: 180,
		cell: ({ getValue }) => (
			<Badge variant="outline" className="font-normal">
				{getValue()}
			</Badge>
		),
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

function LocationDetailPage() {
	const { locationId } = Route.useParams()
	const detailQuery = useQuery(locationResource.detail.queryOptions({ id: Number(locationId) }))

	return (
		<DetailBoundary query={detailQuery}>
			{(response) => <LocationDetail location={response.data} />}
		</DetailBoundary>
	)
}

function LocationDetail({ location }: { location: LocationDto }) {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const canEdit = usePermissionCheck({ permission: 'location.update' })
	const canDelete = usePermissionCheck({ permission: 'location.delete' })
	const removeMut = useMutation(locationResource.remove.mutationOptions())

	const usersQuery = useQuery(
		userResource.byLocation.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			locationId: location.id,
		}),
	)
	const userCount = usersQuery.data?.meta?.total ?? 0

	const { table } = useServerTable({
		data: usersQuery.data?.data ?? [],
		columns: columns as ColumnDef<DataGridFeatures, AssignedUser>[],
		totalCount: userCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	const backToList = () => navigate({ to: '/settings/locations' })

	const handleDelete = async () => {
		await confirm({
			title: 'Delete location?',
			description: `This will permanently delete "${location.name}". This action cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
			onConfirm: async () => {
				try {
					await removeMut.mutateAsync({ id: location.id })
				} catch (error) {
					// e.g. 409 LOCATION_HOLDS_STOCK: show the server's reason.
					toast.add({
						title: error instanceof Error ? error.message : 'Failed to delete location.',
						type: 'error',
					})
					throw error
				}
				toast.add({ title: 'Location deleted successfully.', type: 'success' })
				backToList()
			},
		})
	}

	return (
		<DetailPage
			title={location.name}
			description={location.type === 'store' ? 'Store' : 'Warehouse'}
			breadcrumbs={
				<Button variant="ghost" size="sm" className="-ml-2 gap-1.5" onClick={backToList}>
					<ArrowLeftIcon className="size-3.5" />
					Locations
				</Button>
			}
			status={
				<StatusBadge variant={location.isActive ? 'success' : 'default'}>
					{location.isActive ? 'Active' : 'Inactive'}
				</StatusBadge>
			}
			actions={
				<>
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
					{canDelete && (
						<ActionMenu
							label="More actions"
							items={[
								{
									label: 'Delete location',
									icon: <TrashIcon />,
									onClick: () => void handleDelete(),
									variant: 'destructive',
								},
							]}
						/>
					)}
				</>
			}
		>
			<DetailSection title="Details">
				<DetailList
					columns={3}
					items={[
						{ label: 'Code', value: <span className="font-mono">{location.code}</span> },
						{ label: 'Address', value: location.address || '—' },
						{ label: 'Phone', value: location.phone || '—' },
					]}
				/>
				<AuditInfo createdAt={location.createdAt} createdBy={location.createdBy} />
			</DetailSection>

			<DetailSection
				title="Assigned users"
				className="border-t pt-6"
				description={usersQuery.isLoading ? undefined : `${userCount} assigned to this location.`}
			>
				<DataTable
					table={table}
					recordCount={userCount}
					isLoading={usersQuery.isFetching}
					isError={usersQuery.isError}
					onRetry={() => void usersQuery.refetch()}
					emptyMessage="No users assigned to this location."
				/>
			</DetailSection>
		</DetailPage>
	)
}
