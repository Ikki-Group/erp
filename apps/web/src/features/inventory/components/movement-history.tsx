import { useCallback, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

import { DataTable } from '@/components/data-table/data-table'
import { useServerTable } from '@/components/data-table/use-server-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'

import { stockMovementList } from '@/features/inventory/api.ts'
import { MOVEMENT_TYPE_LABELS } from '@/features/inventory/dto/index.ts'
import type { MovementTypeEnum, StockMovementDto } from '@/features/inventory/dto/index.ts'

// ─── Columns ───

const col = createColumnHelper<DataGridFeatures, StockMovementDto>()

const baseColumns = [
	col.accessor('createdAt', {
		header: 'Tanggal',
		size: 140,
		cell: ({ getValue }) => {
			const date = getValue()
			return (
				<span className="text-sm">
					{new Intl.DateTimeFormat('id-ID', {
						dateStyle: 'medium',
						timeStyle: 'short',
					}).format(new Date(date))}
				</span>
			)
		},
	}),
	col.accessor('type', {
		header: 'Tipe',
		size: 150,
		cell: ({ getValue }) => {
			const type = getValue() as MovementTypeEnum
			return <span className="text-sm">{MOVEMENT_TYPE_LABELS[type] ?? type}</span>
		},
	}),
	col.accessor('direction', {
		header: 'Arah',
		size: 80,
		cell: ({ getValue }) => {
			const dir = getValue()
			if (dir === 'in') {
				return (
					<StatusBadge variant="success">
						<ArrowDownIcon className="size-3" />
						Masuk
					</StatusBadge>
				)
			}
			return (
				<StatusBadge variant="destructive">
					<ArrowUpIcon className="size-3" />
					Keluar
				</StatusBadge>
			)
		},
	}),
	col.accessor('quantity', {
		header: 'Qty',
		size: 90,
		cell: ({ row }) => {
			const qty = Number(row.original.quantity)
			const isOut = row.original.direction === 'out'
			return (
				<span className={`font-mono text-sm ${isOut ? 'text-destructive' : 'text-success'}`}>
					{isOut ? '-' : '+'}
					{qty.toLocaleString('id-ID')}
				</span>
			)
		},
	}),
	col.accessor('notes', {
		header: 'Catatan',
		size: 180,
		cell: ({ getValue }) => {
			const notes = getValue()
			if (!notes) return <span className="text-muted-foreground">—</span>
			return <span className="truncate text-sm">{notes}</span>
		},
	}),
]

// ─── Props ───

interface MovementHistoryProps {
	materialId: number
	locationId: number
}

export function MovementHistory({ materialId, locationId }: MovementHistoryProps) {
	const [listParams, setListParams] = useState({
		page: 1,
		limit: 10,
	})

	const listQuery = useQuery(
		stockMovementList.queryOptions({
			materialId,
			locationId,
			page: listParams.page,
			limit: listParams.limit,
		}),
	)

	const data = listQuery.data?.data ?? []
	const totalCount = listQuery.data?.meta?.total ?? 0

	const columns = useMemo(
		() => baseColumns as ColumnDef<DataGridFeatures, StockMovementDto>[],
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
				title="Belum ada riwayat pergerakan"
				description="Riwayat akan muncul setelah ada transaksi stok untuk material ini."
			/>
		)
	}

	return (
		<DataTable
			table={table}
			recordCount={totalCount}
			isLoading={listQuery.isLoading}
			emptyMessage="Tidak ada data pergerakan."
		/>
	)
}
