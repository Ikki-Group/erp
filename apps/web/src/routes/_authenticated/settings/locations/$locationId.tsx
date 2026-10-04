import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'

import {
	ArrowLeftIcon,
	Building2Icon,
	CalendarIcon,
	MapPinIcon,
	PencilIcon,
	PhoneIcon,
	TrashIcon,
	UserIcon,
	WarehouseIcon,
} from 'lucide-react'

import { listSearchSchema, TextCell } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/shared'
import { StatusBadge } from '@/components/shared/status-badge'
import { confirm } from '@/components/shared/confirm'

import { locationResource } from '@/features/location/api'

const searchSchema = listSearchSchema.extend({
	tab: z.enum(['users', 'details']).default('users'),
})

export const Route = createFileRoute('/_authenticated/settings/locations/$locationId')({
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
	const navigate = useNavigate({ from: Route.fullPath })

	const detailQuery = useQuery({
		...locationResource.detail.queryOptions({ id: Number(locationId) }),
		refetchOnWindowFocus: false,
	})

	const location = detailQuery.data?.data

	// TODO: Replace with actual user assignments endpoint when available
	// Currently showing placeholder - need backend endpoint for GET /iam/user/by-location
	const usersQuery = useQuery({
		queryKey: ['location-users', locationId],
		queryFn: async () => {
			// Placeholder - this would be the actual API call
			// return userResource.byLocation.queryOptions({ locationId: Number(locationId) })
			return { data: [], meta: { total: 0 } }
		},
		enabled: !!location,
	})

	const userCount = usersQuery.data?.meta?.total ?? 0

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
		<div className="space-y-6">
			<PageHeader
				title={location.name}
				description={`Code: ${location.code}`}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={() => navigate({ to: '/settings/locations' })}>
							<ArrowLeftIcon className="size-4" />
							Back
						</Button>
						<Button variant="outline" size="sm" onClick={handleDelete}>
							<TrashIcon className="size-4" />
							Delete
						</Button>
						<Button size="sm" onClick={() => navigate({ to: '/settings/locations/$locationId/edit', params: { locationId: String(locationId) } })}>
							<PencilIcon className="size-4" />
							Edit
						</Button>
					</div>
				}
			/>

			{/* Location Info Card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{location.type === 'store' ? (
							<Building2Icon className="size-5" />
						) : (
							<WarehouseIcon className="size-5" />
						)}
						{location.name}
						<StatusBadge variant={location.isActive ? 'success' : 'default'} className="ml-auto">
							{location.isActive ? 'Active' : 'Inactive'}
						</StatusBadge>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 sm:grid-cols-2">
						{location.address && (
							<div className="flex items-start gap-2">
								<MapPinIcon className="size-4 mt-0.5 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">Address</p>
									<p className="text-sm">{location.address}</p>
								</div>
							</div>
						)}
						{location.phone && (
							<div className="flex items-start gap-2">
								<PhoneIcon className="size-4 mt-0.5 text-muted-foreground" />
								<div>
									<p className="text-xs text-muted-foreground">Phone</p>
									<p className="text-sm">{location.phone}</p>
								</div>
							</div>
						)}
					</div>
					<Separator />
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<CalendarIcon className="size-3.5" />
						<span>
							Created by {location.createdBy} • {new Date(location.createdAt).toLocaleDateString()}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Assigned Users Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserIcon className="size-5" />
						Assigned Users
						<Badge variant="secondary" className="ml-2">
							{userCount}
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						columns={useMemo(() => columns as ColumnDef<DataGridFeatures, AssignedUser>[], [])}
						data={usersQuery.data?.data ?? []}
						isLoading={usersQuery.isLoading}
						emptyMessage="No users assigned to this location."
					/>
				</CardContent>
			</Card>
		</div>
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
