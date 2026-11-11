import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { ArrowLeftIcon, PlusIcon } from 'lucide-react'
import { z } from 'zod'

import { useEditorLocationScope } from '@/lib/form/use-editor-location-scope'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { AuditTrail } from '@/components/shared/audit-trail'
import { DetailBoundary } from '@/components/shared/detail-boundary'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { InlineAlert } from '@/components/shared/inline-alert'
import { LocationRequiredPage } from '@/components/shared/location-required-page'
import { PageError } from '@/components/shared/page-error'
import { PageSection } from '@/components/shared/page-section'
import { PageShell } from '@/components/shared/page-shell'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'

import { auditResource } from '@/features/audit/api'
import type { AuthLocation } from '@/features/auth/dto'
import { opnameResource } from '@/features/inventory/api'
import { OpnameCountForm } from '@/features/inventory/components/opname-count-form'
import { OPNAME_STATUS_LABELS, OpnameStatusEnum } from '@/features/inventory/dto'
import type { OpnameDetailDto, OpnameDto } from '@/features/inventory/dto'
import { useOpnameActions } from '@/features/inventory/use-opname-actions'

import { useLocationContext } from '@/providers/location-provider'

const dateTimestamp = z.string().datetime({ offset: true }).optional().catch(undefined)
const opnameSearchSchema = listSearchSchema.omit({ q: true, sort: true }).extend({
	status: OpnameStatusEnum.optional().catch(undefined),
	dateFrom: dateTimestamp,
	dateTo: dateTimestamp,
	id: z.coerce.number().int().positive().optional().catch(undefined),
})
export const Route = createFileRoute('/_authenticated/inventory/opname')({
	validateSearch: opnameSearchSchema,
	component: OpnameRoute,
})
const col = createEntityColumns<OpnameDto>()
const labels = {
	draft: { label: OPNAME_STATUS_LABELS.draft, variant: 'outline' },
	in_progress: { label: OPNAME_STATUS_LABELS.in_progress, variant: 'warning' },
	completed: { label: OPNAME_STATUS_LABELS.completed, variant: 'success' },
	cancelled: { label: OPNAME_STATUS_LABELS.cancelled, variant: 'destructive' },
} as const

function OpnameRoute() {
	const canRead = usePermissionCheck({ permission: 'opname.read' })
	const { activeLocation } = useLocationContext()
	const { id } = Route.useSearch()
	if (!canRead)
		return (
			<PageError title="Tidak ada akses" message="Anda tidak memiliki izin melihat stock opname." />
		)
	// An open record stays mounted through header changes, including All Locations.
	if (id !== undefined) return <OpnameDetailPage key={id} id={id} />
	if (!activeLocation)
		return (
			<LocationRequiredPage
				title="Stock Opname"
				description="Hitung fisik stok dan bandingkan dengan stok sistem."
				message="Pilih lokasi aktif untuk memulai opname."
			/>
		)
	return <OpnameList key={activeLocation.id} location={activeLocation} />
}

function OpnameList({ location }: { location: AuthLocation }) {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canCreate = usePermissionCheck({ permission: 'opname.create' })
	const actions = useOpnameActions({
		onCreated: (id) => navigate({ search: (prev) => ({ ...prev, id }) }),
	})
	const query = useQuery({
		...opnameResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			status: search.status,
			locationId: location.id,
			dateFrom: search.dateFrom,
			dateTo: search.dateTo,
		}),
		throwOnError: false,
	})
	const columns = useMemo(
		() =>
			[
				col.code('opnameNo', { header: 'No. Opname', size: 160, enableSorting: false }),
				col.status('status', labels, { header: 'Status', size: 140, enableSorting: false }),
				col.date('createdAt', { header: 'Tanggal', size: 150, enableSorting: false }),
				col.date('completedAt', { header: 'Selesai', size: 150, enableSorting: false }),
				col.actions({
					// oxlint-disable-next-line react/no-unstable-nested-components -- action factory
					getItems: (opname) => [
						{
							label: 'Detail',
							onClick: () => navigate({ search: (prev) => ({ ...prev, id: opname.id }) }),
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, OpnameDto>[],
		[navigate],
	)
	const list = useResourceList({
		query,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => !!(value.status || value.dateFrom || value.dateTo),
	})
	return (
		<EntityListPage
			title="Stock Opname"
			description={`Hitung fisik stok di ${location.name}`}
			list={list}
			createAction={
				canCreate ? (
					<Button size="sm" disabled={actions.creating} onClick={() => actions.create(location)}>
						<PlusIcon className="size-4" />
						Buat Opname
					</Button>
				) : undefined
			}
			emptyState={{
				title: 'Belum ada opname',
				description: 'Buat opname untuk memulai penghitungan fisik stok.',
			}}
			emptyMessage="Tidak ada opname yang cocok."
			toolbar={
				<TableToolbar
					filters={[
						{
							key: 'status',
							label: 'Status',
							value: search.status,
							onChange: (value) =>
								list.setFilters({ status: OpnameStatusEnum.safeParse(value).data }),
							options: Object.entries(OPNAME_STATUS_LABELS).map(([value, label]) => ({
								value,
								label,
							})),
							allLabel: 'Semua status',
						},
					]}
					dateRange={{
						key: 'createdAt',
						label: 'Tanggal',
						value:
							search.dateFrom && search.dateTo
								? { from: new Date(search.dateFrom), to: new Date(search.dateTo) }
								: undefined,
						onChange: (range) =>
							list.setFilters({
								dateFrom: range?.from.toISOString(),
								dateTo: range?.to.toISOString(),
							}),
						placeholder: 'Filter tanggal opname',
					}}
				/>
			}
		/>
	)
}

function OpnameDetailPage({ id }: { id: number }) {
	const navigate = useNavigate({ from: Route.fullPath })
	const query = useQuery({ ...opnameResource.detail.queryOptions({ id }), throwOnError: false })
	return (
		<div className="space-y-4">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => navigate({ search: (prev) => ({ ...prev, id: undefined }) })}
			>
				<ArrowLeftIcon className="size-4" />
				Kembali ke daftar
			</Button>
			<DetailBoundary query={query}>
				{(response) => <OpnameSession key={response.data.id} opname={response.data} />}
			</DetailBoundary>
		</div>
	)
}

function OpnameSession({ opname }: { opname: OpnameDetailDto }) {
	const scope = useEditorLocationScope(opname.locationId)
	const canUpdate = usePermissionCheck({ permission: 'opname.update' })
	const canComplete = usePermissionCheck({ permission: 'opname.complete' })
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })
	const actions = useOpnameActions({})
	if (!scope.location) return null
	return (
		<PageShell
			title={opname.opnameNo}
			description={`Status: ${OPNAME_STATUS_LABELS[opname.status]}`}
			contentClassName="space-y-6"
		>
			<OpnameCountForm
				opname={opname}
				scope={{ ...scope, location: scope.location }}
				canUpdate={canUpdate}
				canComplete={canComplete}
				completing={actions.completing}
				onComplete={(expectedCounts) => actions.complete({ ...opname, expectedCounts })}
			/>
			{canReadAudit && <OpnameActivity id={opname.id} />}
		</PageShell>
	)
}

function OpnameActivity({ id }: { id: number }) {
	const query = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'stock_opname', entityId: id }),
		throwOnError: false,
	})
	const entries = query.data?.data
	return (
		<PageSection title="Activity" description="History of changes to this stock count.">
			{query.isError && (
				<InlineAlert
					variant="warning"
					title={entries ? 'Could not refresh activity' : 'Could not load activity'}
				>
					<p>
						{entries
							? 'Showing the last loaded history.'
							: 'The history is unavailable, not empty.'}
					</p>
					<Button
						size="sm"
						variant="outline"
						disabled={query.isFetching}
						onClick={() => void query.refetch()}
					>
						Retry
					</Button>
				</InlineAlert>
			)}
			{(entries || !query.isError) && (
				<AuditTrail
					entries={entries ?? []}
					isLoading={query.isLoading}
					emptyMessage="No changes recorded for this opname yet."
				/>
			)}
		</PageSection>
	)
}
