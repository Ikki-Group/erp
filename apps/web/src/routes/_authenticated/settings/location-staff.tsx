import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useResourceList } from '@/components/data-table'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { LocationRequiredPage } from '@/components/shared/location-required-page'
import { PageError } from '@/components/shared/page-error'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import type { AuthLocation } from '@/features/auth/dto/index.ts'
import { userResource } from '@/features/iam/api.ts'
import {
	LOCATION_STAFF_STATUS_OPTIONS,
	locationStaffColumns,
	locationStaffSearchSchema,
	parseLocationStaffStatus,
} from '@/features/iam/components/location-staff-columns.tsx'

import { useLocationContext } from '@/providers/location-provider.tsx'

export const Route = createFileRoute('/_authenticated/settings/location-staff')({
	validateSearch: locationStaffSearchSchema,
	component: LocationStaffRoute,
})

const TITLE = 'Staf Lokasi'

function LocationStaffRoute() {
	const canRead = usePermissionCheck({ permission: 'location-staff.read' })
	const { isConsolidated, activeLocation } = useLocationContext()

	if (!canRead) {
		return (
			<PageError
				title="Akses ditolak"
				message="Anda tidak memiliki izin untuk melihat staf lokasi ini."
			/>
		)
	}

	if (isConsolidated || !activeLocation) {
		return (
			<LocationRequiredPage
				title={TITLE}
				description="Pengguna yang ditugaskan ke lokasi aktif."
				message="Pilih lokasi aktif untuk melihat staf yang ditugaskan."
			/>
		)
	}

	// Keyed so a header location change cannot carry rows or state across locations.
	return <LocationStaffPage key={activeLocation.id} location={activeLocation} />
}

function LocationStaffPage({ location }: { location: AuthLocation }) {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })

	// The location comes from the X-Location-ID header; the API layer scopes the cache key by it.
	const listQuery = useQuery({
		...userResource.locationStaff.queryOptions({
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			isActive: search.isActive,
		}),
		throwOnError: false,
	})

	const list = useResourceList({
		query: listQuery,
		columns: locationStaffColumns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => value.isActive !== undefined,
	})

	return (
		<EntityListPage
			title={TITLE}
			description={`Users assigned to ${location.name}.`}
			list={list}
			emptyState={{
				title: 'Belum ada staf ditugaskan',
				description: 'Belum ada pengguna yang ditugaskan ke lokasi ini.',
			}}
			emptyMessage="Tidak ada staf yang cocok dengan pencarian Anda."
			toolbar={
				<TableToolbar
					searchValue={list.globalFilter}
					onSearchChange={(q) => list.setFilters({ q: q.trim() || undefined })}
					searchPlaceholder="Cari staf..."
					filters={[
						{
							key: 'isActive',
							label: 'Status',
							value: search.isActive === undefined ? undefined : String(search.isActive),
							onChange: (value) => list.setFilters({ isActive: parseLocationStaffStatus(value) }),
							options: LOCATION_STAFF_STATUS_OPTIONS,
							allLabel: 'Semua Status',
						},
					]}
				/>
			}
		/>
	)
}
