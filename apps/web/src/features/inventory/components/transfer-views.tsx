import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowRightIcon, PlusIcon, SendIcon, TruckIcon } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'

import { DateCell, EmptyCell, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { confirm } from '@/components/shared/confirm'
import { DetailBoundary } from '@/components/shared/detail-boundary'
import { DetailList } from '@/components/shared/detail-list'
import { DetailPage, DetailSection } from '@/components/shared/detail-page'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { transferResource } from '../api.ts'
import { TRANSFER_STATUS_LABELS } from '../dto/index.ts'
import type { TransferDetailDto, TransferDto, TransferStatusEnum } from '../dto/index.ts'
import {
	BackLink,
	DocumentActivity,
	MaterialLabel,
	TransferStatusBadge,
	dateRangeToSearch,
	formatDate,
	formatQty,
	searchToDateRange,
	useLineLookups,
	useLocationName,
} from './document-shared.tsx'
import type { DocumentListSearch } from './document-shared.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

export type TransferListSearch = DocumentListSearch & { status?: TransferStatusEnum }

// ─── List ───

const col = createColumnHelper<DataGridFeatures, TransferDto>()

function transferColumns(location: (id: number) => string) {
	return [
		col.accessor('transferNo', {
			header: 'No. Transfer',
			size: 190,
			cell: ({ row }) => (
				<Link
					to="/inventory/transfers/$transferId"
					params={{ transferId: String(row.original.id) }}
					className="font-mono text-xs hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{row.original.transferNo}
				</Link>
			),
		}),
		col.accessor('status', {
			header: 'Status',
			size: 140,
			cell: ({ getValue }) => <TransferStatusBadge status={getValue()} />,
		}),
		col.display({
			id: 'route',
			header: 'Rute',
			size: 240,
			cell: ({ row }) => (
				<span className="flex min-w-0 items-center gap-1.5 truncate">
					{location(row.original.fromLocationId)}
					<ArrowRightIcon className="size-3 shrink-0 text-muted-foreground" aria-label="ke" />
					{location(row.original.toLocationId)}
				</span>
			),
		}),
		col.accessor('createdAt', {
			header: 'Tanggal',
			size: 130,
			cell: ({ getValue }) => <DateCell value={getValue()} />,
		}),
		col.accessor('notes', {
			header: 'Catatan',
			size: 220,
			cell: ({ getValue }) => getValue() ?? <EmptyCell />,
		}),
	]
}

export function TransferListPage({
	locationId,
	locationName,
	search,
	onSearchChange,
}: {
	locationId: number
	locationName: string
	search: TransferListSearch
	onSearchChange: (next: TransferListSearch) => void
}) {
	const navigate = useNavigate()
	const isMobile = useIsMobile()
	const canCreate = usePermissionCheck({ permission: 'transfer.create' })
	const location = useLocationName()
	const dateRange = searchToDateRange(search)

	const listQuery = useQuery(
		transferResource.list.queryOptions({
			page: search.page,
			limit: search.pageSize,
			status: search.status,
			locationId,
			dateFrom: search.from,
			dateTo: search.to,
		}),
	)
	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const columns = useMemo(() => {
		const all = transferColumns(location)
		return (isMobile ? all.slice(0, 3) : all) as ColumnDef<DataGridFeatures, TransferDto>[]
	}, [isMobile, location])

	const { table } = useServerTable({ data, columns, totalCount, search, onSearchChange })

	const createButton = canCreate ? (
		<Button
			size="sm"
			className="pointer-coarse:h-10"
			nativeButton={false}
			render={<Link to="/inventory/transfers/new" />}
		>
			<PlusIcon className="size-4" />
			Buat Transfer
		</Button>
	) : undefined

	return (
		<EntityListPage
			title="Transfer Inventori"
			description={`Transfer masuk dan keluar ${locationName}`}
			actions={createButton}
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isFetching}
			isError={listQuery.isError}
			onRetry={() => void listQuery.refetch()}
			isEmpty={!listQuery.isLoading && data.length === 0 && !search.status && !dateRange}
			emptyState={{
				title: 'Belum ada transfer',
				description: 'Buat transfer pertama untuk memindahkan bahan antar lokasi.',
				action: createButton,
			}}
			emptyMessage="Tidak ada transfer ditemukan."
			onRowClick={(t) =>
				navigate({ to: '/inventory/transfers/$transferId', params: { transferId: String(t.id) } })
			}
			toolbar={
				<TableToolbar
					filters={[
						{
							key: 'status',
							label: 'Status',
							value: search.status,
							onChange: (v) =>
								onSearchChange({ ...search, page: 1, status: v as TransferStatusEnum | undefined }),
							options: Object.entries(TRANSFER_STATUS_LABELS).map(([value, label]) => ({
								label,
								value,
							})),
							allLabel: 'Semua status',
						},
					]}
					dateRange={{
						key: 'createdAt',
						label: 'Tanggal',
						value: dateRange,
						onChange: (v) => onSearchChange({ ...search, ...dateRangeToSearch(v) }),
						placeholder: 'Filter tanggal transfer',
					}}
				/>
			}
		/>
	)
}

// ─── Detail ───

export function TransferDetailRoute({ id }: { id: number }) {
	const detailQuery = useQuery(transferResource.detail.queryOptions({ id }))
	return (
		<DetailBoundary query={detailQuery}>
			{(res) => <TransferDetailView detail={res.data} />}
		</DetailBoundary>
	)
}

function TransferDetailView({ detail }: { detail: TransferDetailDto }) {
	const { activeLocation } = useLocationContext()
	const canShip = usePermissionCheck({ permission: 'transfer.ship' })
	const canReceive = usePermissionCheck({ permission: 'transfer.receive' })
	const { material, uomCode } = useLineLookups()
	const location = useLocationName()
	const shipMut = useMutation(transferResource.ship.mutationOptions())
	const receiveMut = useMutation(transferResource.receive.mutationOptions())

	const from = location(detail.fromLocationId)
	const to = location(detail.toLocationId)
	const summary = [
		{
			label: 'Rute',
			value: (
				<span className="inline-flex items-center gap-1.5">
					{from}
					<ArrowRightIcon className="size-3 text-muted-foreground" aria-label="ke" />
					{to}
				</span>
			),
		},
		{
			label: 'Jumlah item',
			value: <span className="font-mono tabular-nums">{detail.lines.length}</span>,
		},
	]

	const showShip =
		canShip && detail.status === 'requested' && detail.fromLocationId === activeLocation?.id
	const showReceive =
		canReceive && detail.status === 'in_transit' && detail.toLocationId === activeLocation?.id

	const handleShip = () =>
		confirm({
			title: `Kirim ${detail.transferNo}?`,
			description: `Stok di ${from} langsung berkurang dan transfer ditandai "Dalam Perjalanan". Tindakan ini tidak dapat dibatalkan.`,
			confirmLabel: 'Kirim & kurangi stok',
			cancelLabel: 'Batal',
			tone: 'destructive',
			summary,
			onConfirm: async () => {
				await shipMut.mutateAsync({ transferId: detail.id })
				toast.add({ title: 'Transfer dikirim.', type: 'success' })
			},
		})

	const handleReceive = () =>
		confirm({
			title: `Terima ${detail.transferNo}?`,
			description: `Semua item dicatat diterima penuh dan stok di ${to} bertambah. Tindakan ini tidak dapat dibatalkan.`,
			confirmLabel: 'Terima & tambah stok',
			cancelLabel: 'Batal',
			tone: 'destructive',
			summary,
			onConfirm: async () => {
				await receiveMut.mutateAsync({
					transferId: detail.id,
					lines: detail.lines.map((l) => ({
						materialId: l.materialId,
						receivedQty: l.shippedQty ?? l.requestedQty,
					})),
				})
				toast.add({ title: 'Transfer diterima. Stok diperbarui.', type: 'success' })
			},
		})

	return (
		<DetailPage
			title={detail.transferNo}
			description={`${from} → ${to}`}
			breadcrumbs={<BackLink to="/inventory/transfers" label="Transfer" />}
			status={<TransferStatusBadge status={detail.status} />}
			actions={
				showShip ? (
					<Button size="sm" className="pointer-coarse:h-10" onClick={handleShip}>
						<SendIcon className="size-4" />
						Kirim
					</Button>
				) : showReceive ? (
					<Button size="sm" className="pointer-coarse:h-10" onClick={handleReceive}>
						<TruckIcon className="size-4" />
						Terima
					</Button>
				) : undefined
			}
		>
			<DetailList
				columns={3}
				items={[
					{ label: 'Dari', value: from },
					{ label: 'Ke', value: to },
					{ label: 'Tanggal', value: formatDate(detail.createdAt) },
					{ label: 'Catatan', value: detail.notes ?? '—' },
				]}
			/>

			<DetailSection title={`Item (${detail.lines.length})`}>
				<div className="divide-y rounded-lg border bg-card">
					<div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] gap-4 px-4 py-2 text-xs text-muted-foreground md:grid">
						<span>Material</span>
						<span className="text-right">Diminta</span>
						<span className="text-right">Dikirim</span>
						<span className="text-right">Diterima</span>
					</div>
					{detail.lines.map((line) => {
						const m = material(line.materialId)
						const unit = uomCode(line.uomId)
						return (
							<div
								key={line.id}
								className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm md:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] md:items-center"
							>
								<MaterialLabel name={m?.name ?? `#${line.materialId}`} code={m?.code} />
								<span className="text-right font-mono tabular-nums">
									{formatQty(line.requestedQty)}{' '}
									<span className="text-muted-foreground">{unit}</span>
								</span>
								<QtyCell label="Dikirim" value={line.shippedQty} unit={unit} />
								<QtyCell label="Diterima" value={line.receivedQty} unit={unit} />
							</div>
						)
					})}
				</div>
			</DetailSection>

			<DocumentActivity entity="transfer_request" entityId={detail.id} version={detail.updatedAt} />
		</DetailPage>
	)
}

/** Secondary quantity: its own column on desktop, a labelled caption row on phones. */
function QtyCell({ label, value, unit }: { label: string; value: string | null; unit: string }) {
	return (
		<span className="col-span-2 flex justify-between text-xs text-muted-foreground md:col-span-1 md:block md:text-right md:text-sm md:text-foreground">
			<span className="md:hidden">{label}</span>
			<span className="font-mono tabular-nums">
				{value === null ? '—' : `${formatQty(value)} `}
				{value !== null && <span className="text-muted-foreground">{unit}</span>}
			</span>
		</span>
	)
}
