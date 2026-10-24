import { useMemo, type ReactNode } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { ArrowLeftIcon, EyeIcon, PlusIcon, SendIcon, TruckIcon } from 'lucide-react'
import { z } from 'zod'

import { createEntityColumns, listSearchSchema, useResourceList } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { AuditTrail } from '@/components/shared/audit-trail'
import { DetailBoundary } from '@/components/shared/detail-boundary'
import { DetailList } from '@/components/shared/detail-list'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { InlineAlert } from '@/components/shared/inline-alert'
import { LocationRequiredPage } from '@/components/shared/location-required-page'
import { PageError } from '@/components/shared/page-error'
import { PageSection } from '@/components/shared/page-section'
import { PageShell } from '@/components/shared/page-shell'
import { PermissionGate, usePermissionCheck } from '@/components/shared/permission-gate'
import type { StatusBadgeVariant } from '@/components/shared/status-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'

import { auditResource } from '@/features/audit/api.ts'
import type { AuthLocation } from '@/features/auth/dto/index.ts'
import { transferResource } from '@/features/inventory/api.ts'
import {
	InventoryLineLocation,
	InventoryLineMaterial,
	InventoryLineUom,
} from '@/features/inventory/components/inventory-line-labels.tsx'
import { TRANSFER_STATUS_LABELS, TransferStatusEnum } from '@/features/inventory/dto/index.ts'
import type { TransferDetailDto, TransferDto } from '@/features/inventory/dto/index.ts'
import { useTransferActions } from '@/features/inventory/use-transfer-actions.ts'

import { useLocationContext } from '@/providers/location-provider.tsx'

// The list endpoint filters by status and createdAt range only (no q/sort); the selected transfer
// lives in the URL so Back, refresh, and shared links restore it with the list filters intact.
const isoDateTime = z.string().datetime({ offset: true }).optional().catch(undefined)

const transfersSearchSchema = listSearchSchema.omit({ q: true, sort: true }).extend({
	status: TransferStatusEnum.optional().catch(undefined),
	dateFrom: isoDateTime,
	dateTo: isoDateTime,
	id: z.coerce.number().int().positive().optional().catch(undefined),
})

type TransfersSearch = z.infer<typeof transfersSearchSchema>

export const Route = createFileRoute('/_authenticated/inventory/transfers/')({
	validateSearch: transfersSearchSchema,
	component: TransfersRoute,
})

const STATUS_VARIANTS: Record<TransferStatusEnum, StatusBadgeVariant> = {
	requested: 'info',
	in_transit: 'warning',
	received: 'success',
	cancelled: 'destructive',
}

const STATUS_COLUMN_LABELS = Object.fromEntries(
	TransferStatusEnum.options.map((status) => [
		status,
		{ label: TRANSFER_STATUS_LABELS[status], variant: STATUS_VARIANTS[status] },
	]),
) as Record<TransferStatusEnum, { label: string; variant: StatusBadgeVariant }>

const col = createEntityColumns<TransferDto>()

const fromColumn: ColumnDef<DataGridFeatures, TransferDto> = {
	accessorKey: 'fromLocationId',
	header: 'Dari',
	size: 140,
	enableSorting: false,
	cell: ({ row }) => <InventoryLineLocation id={row.original.fromLocationId} />,
}

const toColumn: ColumnDef<DataGridFeatures, TransferDto> = {
	accessorKey: 'toLocationId',
	header: 'Ke',
	size: 140,
	enableSorting: false,
	cell: ({ row }) => <InventoryLineLocation id={row.original.toLocationId} />,
}

function TransfersRoute() {
	const { activeLocation } = useLocationContext()
	const canRead = usePermissionCheck({ permission: 'transfer.read' })
	const search = Route.useSearch()

	if (!canRead) {
		return (
			<PageError
				title="Tidak ada akses"
				message="Anda tidak memiliki izin untuk melihat transfer inventori."
			/>
		)
	}
	if (!activeLocation) {
		return (
			<LocationRequiredPage
				title="Transfer Inventori"
				description="Transfer bahan baku antar lokasi."
				message="Pilih lokasi aktif untuk melihat data transfer."
			/>
		)
	}
	// Keyed by location so a header switch never leaves a stale list, dialog owner, or selection.
	return search.id ? (
		<TransferDetailPage key={activeLocation.id} location={activeLocation} id={search.id} />
	) : (
		<TransfersPage key={activeLocation.id} location={activeLocation} />
	)
}

function toDateRange(search: TransfersSearch) {
	if (!search.dateFrom || !search.dateTo) return undefined
	return { from: new Date(search.dateFrom), to: new Date(search.dateTo) }
}

function TransfersPage({ location }: { location: AuthLocation }) {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const canCreate = usePermissionCheck({ permission: 'transfer.create' })
	const actions = useTransferActions()

	const listQuery = useQuery({
		...transferResource.list.queryOptions({
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
				col.code('transferNo', { header: 'No. Transfer', size: 140, enableSorting: false }),
				col.status('status', STATUS_COLUMN_LABELS, {
					header: 'Status',
					size: 130,
					enableSorting: false,
				}),
				fromColumn,
				toColumn,
				col.text('notes', { header: 'Catatan', size: 200, enableSorting: false }),
				col.date('createdAt', { header: 'Tanggal', size: 140, enableSorting: false }),
				col.actions({
					// oxlint-disable-next-line react/no-unstable-nested-components
					getItems: (transfer) => [
						{
							label: 'Detail',
							icon: <EyeIcon className="size-4" />,
							onClick: () => navigate({ search: { ...search, id: transfer.id } }),
						},
						actions.canShipTransfer(transfer) && {
							label: 'Kirim',
							icon: <SendIcon className="size-4" />,
							onClick: () => actions.ship(transfer),
							disabled: actions.isPending,
						},
						actions.canReceiveTransfer(transfer) && {
							label: 'Terima',
							icon: <TruckIcon className="size-4" />,
							onClick: () => actions.receive(transfer),
							disabled: actions.isPending,
						},
					],
				}),
			] as ColumnDef<DataGridFeatures, TransferDto>[],
		[actions, navigate, search],
	)

	const list = useResourceList({
		query: listQuery,
		columns,
		search,
		onSearchChange: (next) => navigate({ search: next }),
		hasFilters: (value) => Boolean(value.status || value.dateFrom || value.dateTo),
	})

	const createAction = canCreate ? (
		<Button size="sm" onClick={() => navigate({ to: '/inventory/transfers/new' })}>
			<PlusIcon className="size-4" />
			Buat Transfer
		</Button>
	) : undefined

	return (
		<EntityListPage
			title="Transfer Inventori"
			description={`Transfer antar lokasi dari dan ke ${location.name}`}
			createAction={createAction}
			list={list}
			emptyState={{
				title: 'Belum ada transfer',
				description: 'Buat transfer pertama untuk memindahkan bahan antar lokasi.',
			}}
			emptyMessage="Tidak ada transfer ditemukan."
			toolbar={
				<TableToolbar
					filters={[
						{
							key: 'status',
							label: 'Status',
							value: search.status,
							onChange: (value) =>
								list.setFilters({ status: value as TransferStatusEnum | undefined }),
							options: TransferStatusEnum.options.map((value) => ({
								label: TRANSFER_STATUS_LABELS[value],
								value,
							})),
							allLabel: 'Semua status',
						},
					]}
					dateRange={{
						key: 'createdAt',
						label: 'Tanggal',
						value: toDateRange(search),
						onChange: (range) =>
							list.setFilters({
								dateFrom: range?.from.toISOString(),
								dateTo: range?.to.toISOString(),
							}),
						placeholder: 'Filter tanggal transfer',
					}}
				/>
			}
		/>
	)
}

function TransferDetailPage({ location, id }: { location: AuthLocation; id: number }) {
	const navigate = useNavigate({ from: Route.fullPath })
	const query = useQuery({
		...transferResource.detail.queryOptions({ id }),
		throwOnError: false,
	})

	const back = (
		<Button
			size="sm"
			variant="ghost"
			onClick={() => navigate({ search: (prev) => ({ ...prev, id: undefined }) })}
		>
			<ArrowLeftIcon className="size-3.5" />
			Kembali ke daftar
		</Button>
	)

	return (
		<DetailBoundary
			query={query}
			loading={
				<PageShell title="Detail Transfer" description="Memuat..." actions={back}>
					<span className="sr-only">Memuat transfer</span>
				</PageShell>
			}
			notFound={
				<PageShell title="Detail Transfer" actions={back}>
					<PageError title="Transfer tidak ditemukan" />
				</PageShell>
			}
			error={
				<PageShell title="Detail Transfer" actions={back}>
					<PageError title="Tidak dapat memuat transfer" onRetry={() => void query.refetch()} />
				</PageShell>
			}
		>
			{(response) => <TransferDetail transfer={response.data} location={location} back={back} />}
		</DetailBoundary>
	)
}

function TransferDetail({
	transfer,
	location,
	back,
}: {
	transfer: TransferDetailDto
	location: AuthLocation
	back: ReactNode
}) {
	const canReadAudit = usePermissionCheck({ permission: 'audit.read' })
	const actions = useTransferActions()
	const auditQuery = useQuery({
		...auditResource.byEntity.queryOptions({ entity: 'transfer_request', entityId: transfer.id }),
		enabled: canReadAudit,
		throwOnError: false,
	})

	const inScope = transfer.fromLocationId === location.id || transfer.toLocationId === location.id

	return (
		<PageShell
			title={transfer.transferNo}
			description={`Status: ${TRANSFER_STATUS_LABELS[transfer.status]}`}
			actions={
				<div className="flex flex-wrap items-center gap-2">
					{back}
					{actions.canShipTransfer(transfer) && (
						<Button size="sm" disabled={actions.isPending} onClick={() => actions.ship(transfer)}>
							<SendIcon className="size-4" />
							Kirim
						</Button>
					)}
					{actions.canReceiveTransfer(transfer) && (
						<Button
							size="sm"
							disabled={actions.isPending}
							onClick={() => actions.receive(transfer)}
						>
							<TruckIcon className="size-4" />
							Terima
						</Button>
					)}
				</div>
			}
		>
			<div className="space-y-6">
				{!inScope && (
					<InlineAlert variant="warning" title="Transfer ini bukan milik lokasi aktif">
						<p>
							Transfer ini tidak melibatkan {location.name}. Pindah ke lokasi asal atau tujuan untuk
							mengirim atau menerimanya.
						</p>
					</InlineAlert>
				)}

				<DetailList
					items={[
						{ label: 'Dari', value: <InventoryLineLocation id={transfer.fromLocationId} /> },
						{ label: 'Ke', value: <InventoryLineLocation id={transfer.toLocationId} /> },
						{
							label: 'Status',
							value: (
								<StatusBadge variant={STATUS_VARIANTS[transfer.status]}>
									{TRANSFER_STATUS_LABELS[transfer.status]}
								</StatusBadge>
							),
						},
						{ label: 'Tanggal', value: new Date(transfer.createdAt).toLocaleDateString('id-ID') },
						{ label: 'Catatan', value: transfer.notes ?? '—' },
					]}
				/>

				<div className="space-y-3">
					<h3 className="font-heading text-sm font-semibold tracking-tight">
						Item Transfer ({transfer.lines.length})
					</h3>
					<div className="overflow-x-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="bg-muted/50">
								<tr>
									<th className="px-3 py-2 text-left font-medium">Material</th>
									<th className="px-3 py-2 text-right font-medium">Diminta</th>
									<th className="px-3 py-2 text-right font-medium">Dikirim</th>
									<th className="px-3 py-2 text-right font-medium">Diterima</th>
									<th className="px-3 py-2 text-left font-medium">Satuan</th>
								</tr>
							</thead>
							<tbody>
								{transfer.lines.map((line) => (
									<tr key={line.id} className="border-t">
										<td className="px-3 py-2">
											<InventoryLineMaterial id={line.materialId} />
										</td>
										<td className="px-3 py-2 text-right font-mono tabular-nums">
											{line.requestedQty}
										</td>
										<td className="px-3 py-2 text-right font-mono tabular-nums">
											{line.shippedQty ?? <span className="text-muted-foreground">—</span>}
										</td>
										<td className="px-3 py-2 text-right font-mono tabular-nums">
											{line.receivedQty ?? <span className="text-muted-foreground">—</span>}
										</td>
										<td className="px-3 py-2">
											<InventoryLineUom id={line.uomId} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<PermissionGate permission="audit.read">
					<PageSection title="Activity" description="History of changes to this transfer.">
						{auditQuery.isError && auditQuery.data === undefined ? (
							<PageError
								title="Tidak dapat memuat riwayat"
								onRetry={() => void auditQuery.refetch()}
							/>
						) : (
							<>
								{auditQuery.isError && (
									<InlineAlert variant="warning" title="Riwayat tidak dapat diperbarui">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => void auditQuery.refetch()}
										>
											Coba lagi
										</Button>
									</InlineAlert>
								)}
								<AuditTrail
									entries={auditQuery.data?.data ?? []}
									isLoading={auditQuery.isLoading}
									emptyMessage="No changes recorded for this transfer yet."
								/>
							</>
						)}
					</PageSection>
				</PermissionGate>
			</div>
		</PageShell>
	)
}
