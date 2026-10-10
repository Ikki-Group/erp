import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import {
	ArrowLeftIcon,
	Building2Icon,
	MapPinIcon,
	PencilIcon,
	TrashIcon,
	UserIcon,
	WarehouseIcon,
} from 'lucide-react'
import { z } from 'zod'

import { DataTable, listSearchSchema, TextCell, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import {
	AuditInfo,
	DetailIcon,
	DetailList,
	DetailPage,
	DetailSection,
	StatusBadge,
} from '@/components/shared'
import { confirm } from '@/components/shared/confirm'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

import { userResource } from '@/features/iam/api'
import { locationResource } from '@/features/location/api'

const searchSchema = listSearchSchema.extend({
	tab: z.enum(['users', 'details']).optional().default('users'),
})

export const Route = createFileRoute('/_authenticated/settings/locations/$locationId/')({
	validateSearch: searchSchema,
	component: LocationDetailPage,
})

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
			<Badge variant="secondary" className="font-mono text-xs">
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
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })

	const detailQuery = useQuery({
		...locationResource.detail.queryOptions({ id: Number(locationId) }),
		refetchOnWindowFocus: false,
	})

	const location = detailQuery.data?.data

	const usersQuery = useQuery({
		...userResource.byLocation.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			locationId: Number(locationId),
		}),
		enabled: !!location,
	})

	const userCount = usersQuery.data?.meta?.total ?? 0
	const usersData = usersQuery.data?.data ?? []

	const { table } = useServerTable({
		data: usersData,
		columns: columns as ColumnDef<DataGridFeatures, AssignedUser>[],
		totalCount: userCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	if (detailQuery.isLoading) {
		return (
			<div className="flex h-96 items-center justify-center">
				<Spinner className="size-8" />
			</div>
		)
	}

	if (!location) {
		return (
			<div className="flex h-96 flex-col items-center justify-center gap-4">
				<MapPinIcon className="size-12 text-muted-foreground" />
				<p className="text-muted-foreground">Location not found</p>
				<Button variant="outline" onClick={() => navigate({ to: '/settings/locations' })}>
					<ArrowLeftIcon className="size-4" />
					Back to Locations
				</Button>
			</div>
		)
	}

	const handleDelete = async () => {
		await confirm({
			title: 'Delete Location',
			description: `Are you sure you want to delete "${location.name}"? This action cannot be undone.`,
			confirmLabel: 'Delete',
			variant: 'destructive',
			onConfirm: async () => {
				await locationResource.remove.fetch({ id: location.id })
				navigate({ to: '/settings/locations' })
			},
		})
	}

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
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigate({ to: '/settings/locations' })}
					>
						<ArrowLeftIcon className="size-4" />
						Back
					</Button>
					<Button variant="outline" size="sm" onClick={handleDelete}>
						<TrashIcon className="size-4" />
						Delete
					</Button>
					<Button
						size="sm"
						onClick={() =>
							navigate({
								to: '/settings/locations/$locationId/edit',
								params: { locationId: String(locationId) },
							})
						}
					>
						<PencilIcon className="size-4" />
						Edit
					</Button>
				</div>
			}
		>
			{/* Location Info Card */}
			<DetailSection title="Location Details">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DetailIcon
								icon={location.type === 'store' ? <Building2Icon /> : <WarehouseIcon />}
							/>
							{location.name}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<DetailList
							items={[
								{ label: 'Type', value: location.type === 'store' ? 'Store' : 'Warehouse' },
								{ label: 'Address', value: location.address || '-' },
								{ label: 'Phone', value: location.phone || '-' },
							]}
							columns={2}
						/>
						<AuditInfo createdAt={location.createdAt} createdBy={location.createdBy} />
					</CardContent>
				</Card>
			</DetailSection>

			{/* Assigned Users Table */}
			<DetailSection title="Assigned Users">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<DetailIcon icon={<UserIcon />} />
							Assigned Users
							<Badge variant="secondary" className="ml-2">
								{userCount}
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<DataTable
							table={table}
							isLoading={usersQuery.isLoading}
							emptyMessage="No users assigned to this location."
						/>
					</CardContent>
				</Card>
			</DetailSection>
		</DetailPage>
	)
}

type AssignedUser = {
	id: number
	name: string
	username: string
	email: string
	roleName: string
	isActive: boolean
}
