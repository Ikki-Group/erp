import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { formatCurrency } from '@/lib/format'
import { ch } from '@/lib/table'
import { useDataTable, useDataTableState, textColumn, dateColumn } from '@/lib/table'

import { Page } from '@/components/layout/page'
import { DataTableCard } from '@/components/reui/data-table'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { salesOrderApi } from '@/features/sales/api'

export default function SalesTransactionsReportRoute() {
	const [search, setSearch] = useState('')
	const ds = useDataTableState()
	const { data, isLoading } = useQuery(salesOrderApi.list.query({ ...ds.pagination, q: search }))

	const columns = [
		ch.accessor('id', textColumn({ header: 'ID', size: 100 })),
		ch.accessor('customerName', textColumn({ header: 'Pelanggan', size: 160 })),
		ch.accessor('locationName', textColumn({ header: 'Lokasi', size: 140 })),
		ch.accessor('status', {
			header: 'Status',
			size: 120,
			cell: (v) => (
				<Badge variant={v === 'completed' ? 'default' : v === 'void' ? 'destructive' : 'secondary'}>
					{String(v)}
				</Badge>
			),
		}),
		ch.accessor('totalAmount', {
			header: 'Total',
			size: 120,
			cell: (v) => formatCurrency(Number(v)),
		}),
		ch.accessor('createdAt', dateColumn({ header: 'Tanggal', size: 140 })),
	]

	const table = useDataTable({
		columns,
		data: data?.data?.data ?? [],
		pageCount: data?.data?.meta?.totalPages ?? 1,
		rowCount: data?.data?.meta?.total ?? 0,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Transaksi Penjualan"
				description="Daftar semua transaksi penjualan."
			/>
			<Page.Content className="flex flex-col gap-6">
				<Card className="p-4">
					<Input
						placeholder="Cari transaksi..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="max-w-sm"
					/>
				</Card>
				<DataTableCard table={table} isLoading={isLoading} />
			</Page.Content>
		</Page>
	)
}
