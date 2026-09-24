import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { z } from 'zod'

import { listSearchSchema, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { PageError } from '@/components/shared/page-error'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'

import { userResource } from '@/features/iam/api.ts'
import type { LocationStaffListItemDto } from '@/features/iam/dto/index.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

const locationStaffSearchSchema = listSearchSchema.extend({
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})

export const Route = createFileRoute('/_authenticated/settings/location-staff')({
	validateSearch: locationStaffSearchSchema,
	component: LocationStaffPage,
})

const col = createColumnHelper<DataGridFeatures, LocationStaffListItemDto>()

const locationStaffColumns = [
	col.accessor('name', {
		header: 'Name',
		size: 220,
	}),
	col.accessor('username', {
		header: 'Username',
		size: 160,
		cell: ({ getValue }) => <code className="text-xs text-muted-foreground">{getValue()}</code>,
	}),
	col.accessor('email', {
		header: 'Email',
		size: 220,
	}),
	col.accessor('roleName', {
		header: 'Role',
		size: 180,
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

function LocationStaffPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const canRead = usePermissionCheck({ permission: 'location-staff.read' })
	const { isConsolidated, activeLocation } = useLocationContext()

	const listQuery = useQuery({
		...userResource.locationStaff.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive,
		}),
		enabled: canRead && !isConsolidated,
	})

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0
	const { table, globalFilter } = useServerTable({
		data,
		columns: useMemo(
			() => locationStaffColumns as ColumnDef<DataGridFeatures, LocationStaffListItemDto>[],
			[],
		),
		totalCount,
		search,
		onSearchChange: (next) => navigate({ search: next }),
	})

	if (!canRead) {
		return (
			<PageError
				title="Access denied"
				message="You do not have permission to view staff for this location."
			/>
		)
	}

	if (isConsolidated || !activeLocation) {
		return (
			<PageError
				title="Select a location"
				message="Choose an active location to view its assigned staff."
			/>
		)
	}

	return (
		<EntityListPage
			title="Location Staff"
			description={`Users assigned to ${activeLocation.name}.`}
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isLoading}
			isEmpty={!listQuery.isLoading && data.length === 0 && !globalFilter}
			emptyMessage="No staff assigned to this location."
		/>
	)
}
