import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { ArrowLeftIcon, CheckCircleIcon, PlusIcon } from 'lucide-react'
import { z } from 'zod'

import { toDisplayCurrency } from '@/lib/currency.ts'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { AuditTrail } from '@/components/shared/audit-trail'
import type { DateRange } from '@/components/shared/date-range-filter'
import { DetailBoundary } from '@/components/shared/detail-boundary'
import { DetailList } from '@/components/shared/detail-list'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { InlineAlert } from '@/components/shared/inline-alert'
import { LocationRequiredPage } from '@/components/shared/location-required-page'
import { PageError } from '@/components/shared/page-error'
import { PageSection } from '@/components/shared/page-section'
import { PageShell } from '@/components/shared/page-shell'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { StatusBadge } from '@/components/shared/status-badge'
import type { StatusBadgeVariant } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'

import { auditResource } from '@/features/audit/api.ts'
import type { AuthLocation } from '@/features/auth/dto/index.ts'
import { receivingResource } from '@/features/inventory/api.ts'
import {
	InventoryLineLocation,
	InventoryLineMaterial,
	InventoryLineSupplier,
	InventoryLineUom,
} from '@/features/inventory/components/inventory-line-labels.tsx'
import { RECEIVING_STATUS_LABELS, ReceivingStatusEnum } from '@/features/inventory/dto/index.ts'
import type { ReceivingDetailDto, ReceivingDto } from '@/features/inventory/dto/index.ts'
import { calculateReceivingAmounts } from '@/features/inventory/receiving-amounts.ts'
import { useReceivingConfirmation } from '@/features/inventory/use-receiving-actions.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

const isoTimestamp = z
	.string()
	.refine((value) => !Number.isNaN(Date.parse(value)))
	.optional()
	.catch(undefined)

// No server-side text search or sorting on this endpoint: status, date range, and pagination only.
const receivingSearchSchema = listSearchSchema.omit({ q: true, sort: true }).extend({
	status: ReceivingStatusEnum.optional().catch(undefined),
	dateFrom: isoTimestamp,
	dateTo: isoTimestamp,
	/** Selected receiving; keeps filters and page so Back and reload restore the same view. */
	id: z.coerce.number().int().positive().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/inventory/receiving/')({
	validateSearch: receivingSearchSchema,
	component: ReceivingRoute,
})

const TITLE = 'Penerimaan Barang'

const STATUS_VARIANTS: Record<ReceivingStatusEnum, StatusBadgeVariant> = {
	draft: 'warning',
	confirmed: 'success',
}

const STATUS_LABELS = {
	draft: { label: RECEIVING_STATUS_LABELS.draft, variant: STATUS_VARIANTS.draft },
	confirmed: { label: RECEIVING_STATUS_LABELS.confirmed, variant: STATUS_VARIANTS.confirmed },
} as const

const col = createEntityColumns<ReceivingDto>()

function createReceivingColumns(onOpen: (id: number) => void) {
	return [
		col.code('receivingNo', { header: 'No. Penerimaan', size: 160, enableSorting: false }),
		col.status('status', STATUS_LABELS, { header: 'Status', size: 130, enableSorting: false }),
		{
			id: 'supplier',
			header: 'Supplier',
			size: 180,
			enableSorting: false,
			cell: ({ row }) => <InventoryLineSupplier id={row.original.supplierId} />,
		} satisfies ColumnDef<DataGridFeatures, ReceivingDto>,
		col.text('notes', { header: 'Catatan', size: 200, enableSorting: false }),
		col.date('createdAt', { header: 'Tanggal', size: 140, enableSorting: false }),
		{
			id: 'actions',
			size: 90,
			enableSorting: false,
			cell: ({ row }) => (
				<Button
					size="sm"
					variant="ghost"
					aria-label={`Detail ${row.original.receivingNo}`}
					onClick={() => onOpen(row.original.id)}
				>
					Detail
				</Button>
			),
		} satisfies ColumnDef<DataGridFeatures, ReceivingDto>,
	] as ColumnDef<DataGridFeatures, ReceivingDto>[]
}

function ReceivingRoute() {
	const canRead = usePermissionCheck({ permission: 'receiving.read' })
	const { isConsolidated, activeLocation } = useLocationContext()

	if (!canRead) {
		return (
			<PageError
				title="Access denied"
				message="You do not have permission to view goods receipts."
			/>
		)
	}

	if (isConsolidated || !activeLocation) {
		return (
			<LocationRequiredPage
				title={TITLE}
				description="Catat penerimaan barang dari supplier."
				message="Pilih lokasi aktif untuk melihat data penerimaan."
			/>
		)
	}

	// Keyed so a header location change cannot carry rows, selection, or dialogs across locations.
	return <ReceivingScope key={activeLocation.id} location={activeLocation} />
}

function ReceivingScope({ location }: { location: AuthLocation }) {
	const { id } = Route.useSearch()
	return id === undefined ? (
		<ReceivingListPage location={location} />
	) : (
		<ReceivingDetailPage id={id} location={location} />
	)
}

// ─── List ───

function ReceivingListPage({ location }: { location: AuthLocation }) {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const canCreate = usePermissionCheck({ permission: 'receiving.create' })

	const listQuery = useQuery({
		...receivingResource.list.queryOptions({
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
		() => createReceivingColumns((id) => navigate({ search: (prev) => ({ ...prev, id }) })),
		[navigate],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => Boolean(value.status || value.dateFrom || value.dateTo),
	})

	const dateRange: DateRange | undefined =
		search.dateFrom && search.dateTo
			? { from: new Date(search.dateFrom), to: new Date(search.dateTo) }
			: undefined

	const createAction = canCreate ? (
		<Button size="sm" onClick={() => navigate({ to: '/inventory/receiving/new' })}>
			<PlusIcon className="size-4" />
			Buat Penerimaan
		</Button>
	) : undefined

	return (
		<EntityListPage
			title={TITLE}
			description={`Penerimaan dari supplier ke ${location.name}`}
			list={list}
			createAction={createAction}
			emptyState={{
				title: 'Belum ada penerimaan',
				description: 'Buat penerimaan pertama untuk mencatat barang masuk dari supplier.',
			}}
			emptyMessage="Tidak ada penerimaan ditemukan."
			toolbar={
				<TableToolbar
					filters={[
						{
							key: 'status',
							label: 'Status',
							value: search.status,
							onChange: (value) =>
								list.setFilters({ status: ReceivingStatusEnum.safeParse(value).data }),
							options: Object.entries(RECEIVING_STATUS_LABELS).map(([value, label]) => ({
								label,
								value,
							})),
							allLabel: 'All status',
						},
					]}
					dateRange={{
						key: 'createdAt',
						label: 'Tanggal',
						value: dateRange,
						onChange: (range) =>
							list.setFilters({
								dateFrom: range?.from.toISOString(),
								dateTo: range?.to.toISOString(),
							}),
						placeholder: 'Filter tanggal penerimaan',
					}}
				/>
			}
		/>
	)
}

// ─── Detail ───

function ReceivingDetailPage({ id, location }: { id: number; location: AuthLocation }) {
	const navigate = useNavigate({ from: Route.fullPath })
	const confirmation = useReceivingConfirmation()

	const detailQuery = useQuery({
		...receivingResource.detail.queryOptions({ id }),
		throwOnError: false,
	})
	const receiving = detailQuery.data?.data
	const inScope = receiving?.locationId === location.id

	return (
		<PageShell
			title={receiving?.receivingNo ?? 'Detail Penerimaan'}
			description={receiving ? `Status: ${RECEIVING_STATUS_LABELS[receiving.status]}` : undefined}
			actions={
				receiving && inScope && receiving.status === 'draft' && confirmation.canConfirm ? (
					<Button
						size="sm"
						disabled={confirmation.isPending}
						onClick={() => void confirmation.run(receiving)}
					>
						<CheckCircleIcon className="size-4" />
						Konfirmasi
					</Button>
				) : undefined
			}
		>
			<div className="space-y-6">
				<Button
					size="sm"
					variant="ghost"
					onClick={() => navigate({ search: (prev) => ({ ...prev, id: undefined }) })}
				>
					<ArrowLeftIcon className="size-3.5" />
					Kembali ke daftar
				</Button>
				<DetailBoundary
					query={detailQuery}
					notFound={
						<PageError title="Not found" message="Penerimaan tidak ditemukan di lokasi ini." />
					}
				>
					{({ data }) =>
						data.locationId === location.id ? (
							<ReceivingDetailContent receiving={data} />
						) : (
							<PageError
								title="Lokasi tidak sesuai"
								message="Penerimaan ini milik lokasi lain. Ganti lokasi aktif untuk melihatnya."
							/>
						)
					}
				</DetailBoundary>
			</div>
		</PageShell>
	)
}

function ReceivingDetailContent({ receiving }: { receiving: ReceivingDetailDto }) {
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })
	const amounts = calculateReceivingAmounts(
		receiving.lines.map((line) => ({ qty: line.quantity, unitCost: line.unitCost })),
	)

	return (
		<div className="min-w-0 space-y-6">
			<DetailList
				items={[
					{ label: 'Lokasi', value: <InventoryLineLocation id={receiving.locationId} /> },
					{ label: 'Supplier', value: <InventoryLineSupplier id={receiving.supplierId} /> },
					{
						label: 'Status',
						value: (
							<StatusBadge variant={STATUS_VARIANTS[receiving.status]}>
								{RECEIVING_STATUS_LABELS[receiving.status]}
							</StatusBadge>
						),
					},
					{
						label: 'Tanggal',
						value: new Date(receiving.createdAt).toLocaleDateString('id-ID'),
					},
					{ label: 'Catatan', value: receiving.notes ?? '—' },
				]}
			/>

			<div className="space-y-3">
				<h3 className="font-heading text-sm font-semibold tracking-tight">
					Item Penerimaan ({receiving.lines.length})
				</h3>
				<div className="overflow-x-auto rounded-md border">
					<table className="w-full min-w-[40rem] text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-3 py-2 text-left font-medium">Material</th>
								<th className="px-3 py-2 text-right font-medium">Jumlah</th>
								<th className="px-3 py-2 text-left font-medium">Satuan</th>
								<th className="px-3 py-2 text-right font-medium">Harga Satuan</th>
								<th className="px-3 py-2 text-right font-medium">Subtotal</th>
							</tr>
						</thead>
						<tbody>
							{receiving.lines.map((line, index) => {
								const subtotal = amounts.subtotals[index]
								return (
									<tr key={line.id} className="border-t">
										<td className="px-3 py-2">
											<InventoryLineMaterial id={line.materialId} />
										</td>
										<td className="px-3 py-2 text-right font-mono tabular-nums">{line.quantity}</td>
										<td className="px-3 py-2">
											<InventoryLineUom id={line.uomId} />
										</td>
										<td className="px-3 py-2 text-right font-mono tabular-nums">
											{toDisplayCurrency(line.unitCost)}
										</td>
										<td className="px-3 py-2 text-right font-mono text-sm font-medium tabular-nums">
											{subtotal === undefined ? '—' : toDisplayCurrency(subtotal)}
										</td>
									</tr>
								)
							})}
						</tbody>
						<tfoot className="border-t bg-muted/30">
							<tr>
								<td colSpan={4} className="px-3 py-2 text-right font-medium">
									Total
								</td>
								<td className="px-3 py-2 text-right font-mono text-sm font-medium tabular-nums">
									{amounts.total === undefined ? '—' : toDisplayCurrency(amounts.total)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

			{canReadAudit && <ReceivingActivity receivingId={receiving.id} />}
		</div>
	)
}

function ReceivingActivity({ receivingId }: { receivingId: number }) {
	const query = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'receiving', entityId: receivingId }),
		throwOnError: false,
	})
	const entries = query.data?.data

	return (
		<PageSection title="Activity" description="History of changes to this receiving.">
			{query.isError && (
				<InlineAlert
					variant="warning"
					title={entries ? 'Could not refresh activity' : 'Could not load activity'}
					className="mb-3"
				>
					<p>
						{entries
							? 'Showing the last loaded history.'
							: 'The history is unavailable, not empty.'}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
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
					emptyMessage="No changes recorded for this receiving yet."
				/>
			)}
		</PageSection>
	)
}
