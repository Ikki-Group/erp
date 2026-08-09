import { useCallback, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge, type StatusBadgeVariant } from '@/components/shared/status-badge'

import { stockBalanceList } from '@/features/inventory/api.ts'
import type { StockBalanceDto } from '@/features/inventory/dto/index.ts'

// ─── Stock Status Logic ───

const LOW_STOCK_THRESHOLD = 5

type StockStatus = 'normal' | 'low' | 'out'

function getStockStatus(qty: string): StockStatus {
	const n = Number(qty)
	if (n <= 0) return 'out'
	if (n <= LOW_STOCK_THRESHOLD) return 'low'
	return 'normal'
}

const STATUS_CONFIG: Record<StockStatus, { label: string; variant: StatusBadgeVariant }> = {
	normal: { label: 'Normal', variant: 'success' },
	low: { label: 'Stok Rendah', variant: 'warning' },
	out: { label: 'Habis', variant: 'destructive' },
}

// ─── Columns ───

const col = createColumnHelper<DataGridFeatures, StockBalanceDto>()

const baseColumns = [
	col.accessor('materialId', {
		header: 'Material ID',
		size: 100,
	}),
	col.accessor('quantity', {
		header: 'Qty',
		size: 100,
		cell: ({ getValue }) => {
			const val = getValue()
			return <span className="font-mono text-sm">{Number(val).toLocaleString('id-ID')}</span>
		},
	}),
	col.accessor('costPrice', {
		header: 'Harga Pokok',
		size: 120,
		cell: ({ getValue }) => {
			const val = getValue()
			return <span className="font-mono text-sm">{Number(val).toLocaleString('id-ID')}</span>
		},
	}),
	col.display({
		id: 'status',
		header: 'Status',
		size: 120,
		cell: ({ row }) => {
			const status = getStockStatus(row.original.quantity)
			const config = STATUS_CONFIG[status]
			return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>
		},
	}),
]

// ─── Props ───

interface StockTableProps {
	locationId: number
	onRowClick?: (balance: StockBalanceDto) => void
}

export function StockTable({ locationId, onRowClick }: StockTableProps) {
	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
	})

	const listQuery = useQuery(
		stockBalanceList.queryOptions({
			locationId,
			page: listParams.page,
			limit: listParams.limit,
		}),
	)

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const columns = useMemo(
		() => baseColumns as ColumnDef<DataGridFeatures, StockBalanceDto>[],
		[],
	)

	const handleStateChange = useCallback((params: { page: number; pageSize: number }) => {
		setListParams({
			page: params.page + 1,
			limit: params.pageSize,
		})
	}, [])

	const { table } = useServerTable({
		data,
		columns,
		totalCount,
		pageSize: listParams.limit,
		onStateChange: handleStateChange,
	})

	const isEmpty = !listQuery.isLoading && data.length === 0

	if (isEmpty) {
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
			isLoading={listQuery.isLoading}
			emptyMessage="Tidak ada data stok."
			onRowClick={onRowClick}
		/>
	)
}
