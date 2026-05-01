import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { PlusIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'

import { Button } from '@/components/ui/button'

import { salesOrderApi } from '@/features/sales'
import type { SalesOrderDto } from '@/features/sales'

export const Route = createFileRoute('/_app/sales/orders')({ component: SalesOrderPage })

const ch = createColumnHelper<SalesOrderDto>()

const columns = [
	ch.accessor('id', {
		header: 'No. Pesanan',
		cell: ({ row }) => <span className="font-medium">SO-{row.original.id}</span>,
	}),
	ch.accessor('customerId', {
		header: 'Pelanggan',
		cell: ({ row }) => (
			<span>{row.original.customerId ? `Customer #${row.original.customerId}` : '-'}</span>
		),
	}),
	ch.accessor('transactionDate', {
		header: 'Tanggal',
		cell: ({ row }) => toDateTimeStamp(row.original.transactionDate.toISOString()),
	}),
	ch.accessor('totalAmount', {
		header: 'Total Pembayaran',
		cell: ({ row }) => (
			<span className="font-medium text-right block">
				Rp {row.original.totalAmount.toLocaleString('id-ID')}
			</span>
		),
	}),
	ch.accessor('status', {
		header: 'Status',
		cell: ({ row }) => {
			const status = row.original.status
			if (status === 'closed') return <BadgeDot variant="success-outline">Selesai</BadgeDot>
			if (status === 'open') return <BadgeDot variant="primary-outline">Terbuka</BadgeDot>
			return <BadgeDot variant="destructive-outline">Batal</BadgeDot>
		},
	}),
]

function SalesOrderPage() {
	const { data: ordersData, isLoading } = useQuery(
		salesOrderApi.list.query({ page: 1, limit: 100 }),
	)

	const orders = ordersData?.data?.data ?? []
	const rowCount = ordersData?.data?.total ?? 0

	const table = useDataTable({
		columns,
		data: orders,
		pageCount: Math.ceil(rowCount / 100),
		rowCount,
		ds: { pagination: { limit: 100, page: 1 }, search: '', filters: {} } as any,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Pesanan Penjualan"
				description="Kelola seluruh pesanan pelanggan Anda di sini."
			/>
			<Page.Content>
				<DataTableCard
					title="Daftar Pesanan"
					table={table as any}
					isLoading={isLoading}
					recordCount={rowCount}
					action={
						<Button size="sm" asChild>
							<a href="/sales/pos">
								<PlusIcon className="mr-2 h-4 w-4" /> Buat Pesanan
							</a>
						</Button>
					}
				/>
			</Page.Content>
		</Page>
	)
}
