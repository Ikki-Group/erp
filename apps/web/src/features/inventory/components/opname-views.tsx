import { useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { PlusIcon } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'

import { DateCell, EmptyCell, useServerTable } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { confirm } from '@/components/shared/confirm'
import { DetailBoundary } from '@/components/shared/detail-boundary'
import { DetailList } from '@/components/shared/detail-list'
import { DetailPage, DetailSection } from '@/components/shared/detail-page'
import { EmptyState } from '@/components/shared/empty-state'
import { EntityListPage } from '@/components/shared/entity-list-page'
import { usePermissionCheck } from '@/components/shared/permission-gate'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { opnameResource } from '../api.ts'
import { OPNAME_STATUS_LABELS } from '../dto/index.ts'
import type { OpnameDetailDto, OpnameDto, OpnameLineDto, OpnameStatusEnum } from '../dto/index.ts'
import {
	BackLink,
	DocumentActivity,
	OpnameStatusBadge,
	dateRangeToSearch,
	formatDate,
	searchToDateRange,
	useLocationName,
} from './document-shared.tsx'
import type { DocumentListSearch } from './document-shared.tsx'
import { OpnameCountForm } from './opname-count-form.tsx'
import type { CountLine } from './opname-count-form.tsx'

export type OpnameListSearch = DocumentListSearch & { status?: OpnameStatusEnum }

// ─── List ───

const col = createColumnHelper<DataGridFeatures, OpnameDto>()

function opnameColumns() {
	return [
		col.accessor('opnameNo', {
			header: 'No. Opname',
			size: 190,
			cell: ({ row }) => (
				<Link
					to="/inventory/opname/$opnameId"
					params={{ opnameId: String(row.original.id) }}
					className="font-mono text-xs hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{row.original.opnameNo}
				</Link>
			),
		}),
		col.accessor('status', {
			header: 'Status',
			size: 130,
			cell: ({ getValue }) => <OpnameStatusBadge status={getValue()} />,
		}),
		col.accessor('createdAt', {
			header: 'Snapshot',
			size: 130,
			cell: ({ getValue }) => <DateCell value={getValue()} />,
		}),
		col.accessor('completedAt', {
			header: 'Selesai',
			size: 130,
			cell: ({ getValue }) => (getValue() ? <DateCell value={getValue()} /> : <EmptyCell />),
		}),
	]
}

export function OpnameListPage({
	locationId,
	locationName,
	search,
	onSearchChange,
}: {
	locationId: number
	locationName: string
	search: OpnameListSearch
	onSearchChange: (next: OpnameListSearch) => void
}) {
	const navigate = useNavigate()
	const isMobile = useIsMobile()
	const canCreate = usePermissionCheck({ permission: 'opname.create' })
	const createMut = useMutation(opnameResource.create.mutationOptions())
	const dateRange = searchToDateRange(search)

	const listQuery = useQuery(
		opnameResource.list.queryOptions({
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

	const open = (id: number) =>
		navigate({ to: '/inventory/opname/$opnameId', params: { opnameId: String(id) } })

	const handleCreate = async () => {
		let createdId: number | undefined
		const ok = await confirm({
			title: `Snapshot stok ${locationName} sekarang?`,
			description:
				'Stok sistem setiap material di lokasi ini dicatat saat ini sebagai acuan hitung. Penjualan dan transaksi tetap berjalan; selisih dihitung terhadap snapshot ini.',
			confirmLabel: 'Buat snapshot',
			cancelLabel: 'Batal',
			onConfirm: async () => {
				const res = await createMut.mutateAsync({ locationId })
				createdId = res.data.id
				toast.add({ title: 'Opname dibuat.', type: 'success' })
			},
		})
		if (ok && createdId) open(createdId)
	}

	const columns = useMemo(() => {
		const all = opnameColumns()
		return (isMobile ? all.slice(0, 3) : all) as ColumnDef<DataGridFeatures, OpnameDto>[]
	}, [isMobile])

	const { table } = useServerTable({ data, columns, totalCount, search, onSearchChange })

	const createButton = canCreate ? (
		<Button
			size="sm"
			className="pointer-coarse:h-10"
			onClick={handleCreate}
			disabled={createMut.isPending}
		>
			<PlusIcon className="size-4" />
			Buat Opname
		</Button>
	) : undefined

	return (
		<EntityListPage
			title="Stock Opname"
			description={`Hitung fisik stok di ${locationName}`}
			actions={createButton}
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isFetching}
			isError={listQuery.isError}
			onRetry={() => void listQuery.refetch()}
			isEmpty={!listQuery.isLoading && data.length === 0 && !search.status && !dateRange}
			emptyState={{
				title: 'Belum ada opname',
				description: 'Buat opname pertama untuk memulai penghitungan fisik stok.',
				action: createButton,
			}}
			emptyMessage="Tidak ada opname ditemukan."
			onRowClick={(o) => open(o.id)}
			toolbar={
				<TableToolbar
					filters={[
						{
							key: 'status',
							label: 'Status',
							value: search.status,
							onChange: (v) =>
								onSearchChange({ ...search, page: 1, status: v as OpnameStatusEnum | undefined }),
							// The server only uses draft/completed today.
							options: (['draft', 'completed'] as const).map((value) => ({
								label: OPNAME_STATUS_LABELS[value],
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
						placeholder: 'Filter tanggal opname',
					}}
				/>
			}
		/>
	)
}

// ─── Detail ───

export function OpnameDetailRoute({ id }: { id: number }) {
	const detailQuery = useQuery(opnameResource.detail.queryOptions({ id }))
	return (
		<DetailBoundary query={detailQuery}>
			{(res) => <OpnameDetailView detail={res.data} />}
		</DetailBoundary>
	)
}

/** Lines whose counted qty differs from the snapshot, split by sign. Qty only, no money. */
function varianceSummary(lines: OpnameLineDto[]) {
	let over = 0
	let under = 0
	for (const l of lines) {
		const d = Number(l.actualQty) - Number(l.systemQty)
		if (d > 0) over++
		else if (d < 0) under++
	}
	return { over, under }
}

function OpnameDetailView({ detail }: { detail: OpnameDetailDto }) {
	const canUpdate = usePermissionCheck({ permission: 'opname.update' })
	const canComplete = usePermissionCheck({ permission: 'opname.complete' })
	const location = useLocationName()
	const updateCountsMut = useMutation(opnameResource.updateCounts.mutationOptions())
	const completeMut = useMutation(opnameResource.complete.mutationOptions())
	// The server only accepts counts/complete while the opname is draft.
	const isOpen = detail.status === 'draft'

	const save = async (lines: CountLine[]) => {
		if (lines.length === 0) return
		await updateCountsMut.mutateAsync({ opnameId: detail.id, lines })
	}

	const handleSave = async (lines: CountLine[]) => {
		try {
			await save(lines)
			toast.add({ title: 'Hitungan disimpan.', type: 'success' })
		} catch {
			toast.add({ title: 'Gagal menyimpan hitungan.', type: 'error' })
		}
	}

	const handleComplete = async (unsaved: CountLine[]) => {
		let fresh: OpnameDetailDto
		try {
			// Complete works on what the server has, so flush pending edits first.
			await save(unsaved)
			fresh = (await opnameResource.detail.fetch({ id: detail.id })).data
		} catch {
			toast.add({ title: 'Gagal menyimpan hitungan.', type: 'error' })
			return
		}
		const { over, under } = varianceSummary(fresh.lines)
		const num = (n: number) => <span className="font-mono tabular-nums">{n}</span>
		await confirm({
			title: `Selesaikan ${fresh.opnameNo}?`,
			description:
				'Penyesuaian stok dibuat untuk setiap material yang selisih. Material tanpa hitungan dianggap sesuai stok sistem. Tindakan ini tidak dapat dibatalkan.',
			confirmLabel: 'Selesaikan & sesuaikan stok',
			cancelLabel: 'Batal',
			tone: 'destructive',
			summary: [
				{ label: 'Lokasi', value: location(fresh.locationId) },
				{ label: 'Material', value: num(fresh.lines.length) },
				{ label: 'Dengan selisih', value: num(over + under) },
				{
					label: 'Lebih / kurang',
					value: (
						<span className="font-mono tabular-nums">
							<span className="text-success">+{over}</span>
							{' / '}
							<span className="text-destructive">−{under}</span>
						</span>
					),
				},
			],
			onConfirm: async () => {
				await completeMut.mutateAsync({ opnameId: fresh.id })
				toast.add({ title: 'Opname selesai. Penyesuaian stok dibuat.', type: 'success' })
			},
		})
	}

	return (
		<DetailPage
			title={detail.opnameNo}
			description={`Snapshot stok ${location(detail.locationId)}`}
			breadcrumbs={<BackLink to="/inventory/opname" label="Stock Opname" />}
			status={<OpnameStatusBadge status={detail.status} />}
		>
			<DetailList
				columns={3}
				items={[
					{ label: 'Lokasi', value: location(detail.locationId) },
					{ label: 'Snapshot', value: formatDate(detail.startedAt ?? detail.createdAt) },
					{ label: 'Selesai', value: formatDate(detail.completedAt) },
				]}
			/>

			<DetailSection
				title={`Hitungan (${detail.lines.length})`}
				description={
					isOpen && canUpdate
						? 'Isi stok aktual hasil hitung. Kosongkan bila sama dengan stok sistem.'
						: undefined
				}
			>
				{detail.lines.length === 0 ? (
					<EmptyState
						title="Tidak ada material"
						description="Opname ini tidak memiliki baris material."
					/>
				) : (
					<OpnameCountForm
						lines={detail.lines}
						isEditable={isOpen && canUpdate}
						isSaving={updateCountsMut.isPending}
						onSave={handleSave}
						onComplete={isOpen && canComplete ? handleComplete : undefined}
					/>
				)}
			</DetailSection>

			<DocumentActivity entity="stock_opname" entityId={detail.id} version={detail.updatedAt} />
		</DetailPage>
	)
}
