import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { useIsMobile } from '@/hooks/use-mobile'

import type { ListSearch } from '@/components/data-table'
import { CurrencyCell, NumericCell, rightAlignedHeader } from '@/components/data-table/cell'
import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { TableToolbar } from '@/components/shared/table-toolbar'

import { stockBalanceList } from '@/features/inventory/api.ts'
import type { StockBalanceDto } from '@/features/inventory/dto/index.ts'

import type { StockBalanceStatusEnum } from '@ikki/contract/inventory/stock'

export type StockListSearch = ListSearch & { status?: StockBalanceStatusEnum }

const STATUS_LABELS: Record<StockBalanceStatusEnum, string> = {
	low: 'Stok rendah',
	negative: 'Minus',
}

/** Only exceptions get a badge; a healthy row stays quiet. Mirrors the server `status` filter. */
function stockStatus(b: StockBalanceDto): StockBalanceStatusEnum | undefined {
	const qty = Number(b.quantity)
	if (qty < 0) return 'negative'
	if (b.minStock !== null && qty < Number(b.minStock)) return 'low'
	return undefined
}

function StockStatus({ balance }: { balance: StockBalanceDto }) {
	const status = stockStatus(balance)
	if (!status) return null
	return (
		<StatusBadge variant={status === 'negative' ? 'destructive' : 'warning'}>
			{STATUS_LABELS[status]}
		</StatusBadge>
	)
}

// ─── Columns ───

const col = createColumnHelper<DataGridFeatures, StockBalanceDto>()

function materialColumn(withStatus: boolean) {
	return col.accessor('materialName', {
		header: 'Material',
		size: withStatus ? 210 : 260,
		cell: ({ row }) => (
			<span className="flex min-w-0 flex-col items-start gap-0.5">
				<span className="w-full truncate font-medium">{row.original.materialName}</span>
				<span className="font-mono text-xs text-muted-foreground">{row.original.materialCode}</span>
				{withStatus && <StockStatus balance={row.original} />}
			</span>
		),
	})
}

const quantityColumn = col.accessor('quantity', {
	header: rightAlignedHeader('Stok'),
	size: 130,
	cell: ({ row }) => <NumericCell value={row.original.quantity} unit={row.original.uomCode} />,
})

const desktopColumns = [
	materialColumn(false),
	quantityColumn,
	col.accessor('minStock', {
		header: rightAlignedHeader('Min. stok'),
		size: 120,
		cell: ({ getValue, row }) => (
			<NumericCell value={getValue()} unit={row.original.uomCode} muted />
		),
	}),
	col.accessor('costPrice', {
		header: rightAlignedHeader('Harga pokok'),
		size: 140,
		cell: ({ getValue }) => <CurrencyCell value={getValue()} />,
	}),
	col.display({
		id: 'status',
		header: 'Status',
		size: 130,
		cell: ({ row }) => <StockStatus balance={row.original} />,
	}),
] as ColumnDef<DataGridFeatures, StockBalanceDto>[]

// Phones: material (with its status badge inline) + quantity — no horizontal scroll.
const mobileColumns = [materialColumn(true), quantityColumn] as ColumnDef<
	DataGridFeatures,
	StockBalanceDto
>[]

// ─── Component ───

interface StockTableProps {
	locationId: number
	search: StockListSearch
	onSearchChange: (next: StockListSearch) => void
	onRowClick?: (balance: StockBalanceDto) => void
}

export function StockTable({ locationId, search, onSearchChange, onRowClick }: StockTableProps) {
	const isMobile = useIsMobile()
	const listQuery = useQuery(
		stockBalanceList.queryOptions({
			locationId,
			page: search.page,
			limit: search.pageSize,
			q: search.q,
			status: search.status,
		}),
	)
	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0
	const columns = useMemo(() => (isMobile ? mobileColumns : desktopColumns), [isMobile])

	const { table, globalFilter } = useServerTable({
		data,
		columns,
		totalCount,
		search,
		onSearchChange: (next) => onSearchChange({ ...search, ...next }),
	})

	if (
		!listQuery.isLoading &&
		!listQuery.isError &&
		totalCount === 0 &&
		!search.q &&
		!search.status
	) {
		return (
			<EmptyState
				title="Belum ada data stok"
				description="Stok akan muncul setelah ada penerimaan barang di lokasi ini."
			/>
		)
	}

	return (
		<DataTable
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isFetching}
			isError={listQuery.isError}
			errorTitle="Gagal memuat data stok"
			onRetry={() => void listQuery.refetch()}
			emptyMessage="Tidak ada material yang cocok."
			onRowClick={onRowClick}
			toolbar={
				<TableToolbar
					searchValue={globalFilter}
					onSearchChange={(value) => table.setGlobalFilter(value)}
					searchPlaceholder="Cari material..."
					filters={[
						{
							key: 'status',
							label: 'Status',
							value: search.status,
							onChange: (v) =>
								onSearchChange({
									...search,
									page: 1,
									status: v as StockBalanceStatusEnum | undefined,
								}),
							options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ label, value })),
							allLabel: 'Semua status',
						},
					]}
				/>
			}
		/>
	)
}
