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
import { LOCATION_TYPE_OPTIONS } from '@/features/location/dto'
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
				title="Akses ditolak"
				message="Anda tidak memiliki izin untuk melihat detail lokasi."
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
					<p className="text-muted-foreground">Lokasi tidak ditemukan</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigate({ to: '/settings/locations' })}
					>
						<ArrowLeftIcon />
						Kembali ke Lokasi
					</Button>
				</div>
			}
		>
			{(response) => <LocationDetail key={response.data.id} location={response.data} />}
		</DetailBoundary>
	)
}

function renderLocationError(_error: Error, retry: () => void) {
	return <PageError title="Gagal memuat lokasi" onRetry={retry} />
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
					{location.isActive ? 'Aktif' : 'Nonaktif'}
				</StatusBadge>
			}
			actions={
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigate({ to: '/settings/locations' })}
					>
						<ArrowLeftIcon />
						Kembali
					</Button>
					{deletion.canDelete && (
						<Button
							variant="destructive"
							size="sm"
							disabled={deletion.isPending}
							onClick={() => void deletion.run(location)}
						>
							<TrashIcon />
							Nonaktifkan
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
							<PencilIcon />
							Ubah
						</Button>
					)}
				</div>
			}
		>
			<DetailSection title="Detail Lokasi">
				<DetailList
					items={[
						{
							label: 'Tipe',
							value:
								LOCATION_TYPE_OPTIONS.find((option) => option.value === location.type)?.label ??
								location.type,
						},
						{ label: 'Alamat', value: location.address || '-' },
						{ label: 'Telepon', value: location.phone || '-' },
					]}
					columns={2}
				/>
				<AuditInfo
					createdAt={location.createdAt}
					createdBy={location.createdBy}
					updatedAt={location.updatedAt}
					updatedBy={location.updatedBy}
				/>
			</DetailSection>

			<AssignedUsersSection locationId={location.id} />
		</DetailPage>
	)
}

/** Reads staff for this route's location explicitly; the header location is irrelevant here. */
function AssignedUsersSection({ locationId }: { locationId: number }) {
	const canReadUsers = usePermissionCheck({ permission: 'iam.read' })

	return (
		<DetailSection title="Pengguna Ditugaskan">
			{canReadUsers ? (
				<AssignedUsersTable key={locationId} locationId={locationId} />
			) : (
				<InlineAlert variant="info" title="Pengguna yang ditugaskan tidak tersedia">
					<p>
						Anda memerlukan izin melihat pengguna dan peran untuk melihat siapa yang ditugaskan di
						sini.
					</p>
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
			searchPlaceholder="Cari pengguna yang ditugaskan..."
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
	)

	if (list.state === 'initial-error') {
		return (
			<div className="space-y-4">
				{toolbar}
				<PageError title="Gagal memuat pengguna yang ditugaskan" onRetry={list.retry} />
			</div>
		)
	}

	return (
		<div className="min-w-0 space-y-4" aria-busy={list.isRefreshing}>
			{list.state === 'refresh-error' && (
				<InlineAlert variant="warning" title="Gagal memuat ulang pengguna yang ditugaskan">
					<p>Menampilkan hasil terakhir yang dimuat.</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={list.isRefreshing}
						onClick={list.retry}
					>
						Muat ulang
					</Button>
				</InlineAlert>
			)}
			<DataTable
				table={list.table}
				recordCount={list.recordCount}
				isLoading={list.state === 'initial-loading'}
				emptyMessage={
					list.state === 'record-empty'
						? 'Belum ada pengguna yang ditugaskan ke lokasi ini.'
						: 'Tidak ada pengguna yang ditugaskan yang cocok dengan pencarian Anda.'
				}
				toolbar={toolbar}
			/>
		</div>
	)
}
