import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { CheckCircleIcon, PlusIcon } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'

import { DateCell, EmptyCell, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { confirm } from '@/components/shared/confirm'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { DetailBoundary } from '@/components/shared/detail-boundary'
import { DetailList } from '@/components/shared/detail-list'
import { DetailPage, DetailSection } from '@/components/shared/detail-page'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { supplierResource } from '@/features/supplier/api.ts'

import { receivingResource } from '../api.ts'
import { RECEIVING_STATUS_LABELS } from '../dto/index.ts'
import type { ReceivingDetailDto, ReceivingDto, ReceivingStatusEnum } from '../dto/index.ts'
import {
	BackLink,
	DocumentActivity,
	MaterialLabel,
	ReceivingStatusBadge,
	dateRangeToSearch,
	formatDate,
	formatQty,
	searchToDateRange,
	useLineLookups,
	useLocationName,
} from './document-shared.tsx'
import type { DocumentListSearch } from './document-shared.tsx'

export type ReceivingListSearch = DocumentListSearch & { status?: ReceivingStatusEnum }

// ─── List ───

const col = createColumnHelper<DataGridFeatures, ReceivingDto>()

function useSupplierName() {
	const suppliersQuery = useQuery(supplierResource.list.queryOptions({ page: 1, limit: 500 }))
	return useMemo(() => {
		const map = new Map((suppliersQuery.data?.data ?? []).map((s) => [s.id, s.name] as const))
		return (id: number) => map.get(id) ?? `#${id}`
	}, [suppliersQuery.data])
}

function receivingColumns(supplierName: (id: number) => string) {
	return [
		col.accessor('receivingNo', {
			header: 'No. Penerimaan',
			size: 190,
			cell: ({ row }) => (
				<Link
					to="/inventory/receiving/$receivingId"
					params={{ receivingId: String(row.original.id) }}
					className="font-mono text-xs hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{row.original.receivingNo}
				</Link>
			),
		}),
		col.accessor('status', {
			header: 'Status',
			size: 120,
			cell: ({ getValue }) => <ReceivingStatusBadge status={getValue()} />,
		}),
		col.accessor('supplierId', {
			header: 'Supplier',
			size: 180,
			cell: ({ getValue }) => <span className="truncate">{supplierName(getValue())}</span>,
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

export function ReceivingListPage({
	locationId,
	locationName,
	search,
	onSearchChange,
}: {
	locationId: number
	locationName: string
	search: ReceivingListSearch
	onSearchChange: (next: ReceivingListSearch) => void
}) {
	const navigate = useNavigate()
	const isMobile = useIsMobile()
	const canCreate = usePermissionCheck({ permission: 'receiving.create' })
	const supplierName = useSupplierName()
	const dateRange = searchToDateRange(search)

	const listQuery = useQuery(
		receivingResource.list.queryOptions({
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
		const all = receivingColumns(supplierName)
		return (isMobile ? all.slice(0, 3) : all) as ColumnDef<DataGridFeatures, ReceivingDto>[]
	}, [isMobile, supplierName])

	const { table } = useServerTable({ data, columns, totalCount, search, onSearchChange })

	const createButton = canCreate ? (
		<Button
			size="sm"
			className="pointer-coarse:h-10"
			nativeButton={false}
			render={<Link to="/inventory/receiving/new" />}
		>
			<PlusIcon className="size-4" />
			Buat Penerimaan
		</Button>
	) : undefined

	return (
		<EntityListPage
			title="Penerimaan Barang"
			description={`Penerimaan dari supplier ke ${locationName}`}
			actions={createButton}
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isFetching}
			isError={listQuery.isError}
			onRetry={() => void listQuery.refetch()}
			isEmpty={!listQuery.isLoading && data.length === 0 && !search.status && !dateRange}
			emptyState={{
				title: 'Belum ada penerimaan',
				description: 'Buat penerimaan pertama untuk mencatat barang masuk dari supplier.',
				action: createButton,
			}}
			emptyMessage="Tidak ada penerimaan ditemukan."
			onRowClick={(r) =>
				navigate({ to: '/inventory/receiving/$receivingId', params: { receivingId: String(r.id) } })
			}
			toolbar={
				<TableToolbar
					filters={[
						{
							key: 'status',
							label: 'Status',
							value: search.status,
							onChange: (v) =>
								onSearchChange({
									...search,
									page: 1,
									status: v as ReceivingStatusEnum | undefined,
								}),
							options: Object.entries(RECEIVING_STATUS_LABELS).map(([value, label]) => ({
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
						placeholder: 'Filter tanggal penerimaan',
					}}
				/>
			}
		/>
	)
}

// ─── Detail ───

export function ReceivingDetailRoute({ id }: { id: number }) {
	const detailQuery = useQuery(receivingResource.detail.queryOptions({ id }))
	return (
		<DetailBoundary query={detailQuery}>
			{(res) => <ReceivingDetailView detail={res.data} />}
		</DetailBoundary>
	)
}

/** Σ qty per UoM code. Only shown when it stays readable (≤ 3 units). */
function qtyByUom(lines: ReceivingDetailDto['lines'], uomCode: (id: number) => string) {
	const totals = new Map<string, number>()
	for (const l of lines) {
		const code = uomCode(l.uomId)
		totals.set(code, (totals.get(code) ?? 0) + Number(l.quantity))
	}
	if (totals.size > 3) return undefined
	return [...totals].map(([code, qty]) => `${formatQty(qty)} ${code}`).join(' · ')
}

function ReceivingDetailView({ detail }: { detail: ReceivingDetailDto }) {
	const canConfirm = usePermissionCheck({ permission: 'receiving.confirm' })
	const { material, uomCode, isReady: lookupsReady } = useLineLookups()
	const locationName = useLocationName()
	const supplierQuery = useQuery(supplierResource.detail.queryOptions({ id: detail.supplierId }))
	const supplierName = supplierQuery.data?.data.name ?? `#${detail.supplierId}`
	const confirmMut = useMutation(receivingResource.confirm.mutationOptions())

	const handleConfirm = async () => {
		const totalQty = qtyByUom(detail.lines, uomCode)
		await confirm({
			title: `Konfirmasi ${detail.receivingNo}?`,
			description:
				'Stok di lokasi tujuan bertambah sesuai item di bawah. Setelah dikonfirmasi, penerimaan tidak dapat diubah atau dibatalkan.',
			confirmLabel: 'Konfirmasi & tambah stok',
			cancelLabel: 'Batal',
			tone: 'destructive',
			summary: [
				{ label: 'Lokasi tujuan', value: locationName(detail.locationId) },
				{ label: 'Supplier', value: supplierName },
				{
					label: 'Jumlah item',
					value: <span className="font-mono tabular-nums">{detail.lines.length}</span>,
				},
				...(totalQty
					? [
							{
								label: 'Total qty',
								value: <span className="font-mono tabular-nums">{totalQty}</span>,
							},
						]
					: []),
				{
					label: 'Total nilai',
					value: <CurrencyDisplay value={detail.totalValue} className="font-mono tabular-nums" />,
				},
			],
			onConfirm: async () => {
				await confirmMut.mutateAsync({ receivingId: detail.id })
				toast.add({ title: 'Penerimaan dikonfirmasi. Stok diperbarui.', type: 'success' })
			},
		})
	}

	return (
		<DetailPage
			title={detail.receivingNo}
			description={`Penerimaan dari ${supplierName}`}
			breadcrumbs={<BackLink to="/inventory/receiving" label="Penerimaan" />}
			status={<ReceivingStatusBadge status={detail.status} />}
			actions={
				detail.status === 'draft' && canConfirm ? (
					<Button
						size="sm"
						className="pointer-coarse:h-10"
						onClick={handleConfirm}
						disabled={!lookupsReady || !supplierQuery.isSuccess}
					>
						<CheckCircleIcon className="size-4" />
						Konfirmasi
					</Button>
				) : undefined
			}
		>
			<DetailList
				columns={3}
				items={[
					{ label: 'Lokasi tujuan', value: locationName(detail.locationId) },
					{ label: 'Supplier', value: supplierName },
					{ label: 'Tanggal', value: formatDate(detail.createdAt) },
					{
						label: 'Total nilai',
						value: <CurrencyDisplay value={detail.totalValue} className="font-mono tabular-nums" />,
					},
					{ label: 'Catatan', value: detail.notes ?? '—' },
				]}
			/>

			<DetailSection title={`Item (${detail.lines.length})`}>
				<div className="divide-y rounded-lg border bg-card">
					<div className="hidden grid-cols-[minmax(0,1fr)_10rem_10rem] gap-4 px-4 py-2 text-xs text-muted-foreground md:grid">
						<span>Material</span>
						<span className="text-right">Jumlah</span>
						<span className="text-right">Harga satuan</span>
					</div>
					{detail.lines.map((line) => {
						const m = material(line.materialId)
						return (
							<div
								key={line.id}
								className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm md:grid-cols-[minmax(0,1fr)_10rem_10rem] md:items-center"
							>
								<MaterialLabel name={m?.name ?? `#${line.materialId}`} code={m?.code} />
								<span className="text-right font-mono tabular-nums">
									{formatQty(line.quantity)}{' '}
									<span className="text-muted-foreground">{uomCode(line.uomId)}</span>
								</span>
								<span className="col-span-2 text-right text-xs text-muted-foreground md:col-span-1 md:text-sm md:text-foreground">
									<span className="md:hidden">@ </span>
									<CurrencyDisplay value={line.unitCost} className="font-mono tabular-nums" />
								</span>
							</div>
						)
					})}
				</div>
			</DetailSection>

			<DocumentActivity entity="receiving" entityId={detail.id} version={detail.updatedAt} />
		</DetailPage>
	)
}
