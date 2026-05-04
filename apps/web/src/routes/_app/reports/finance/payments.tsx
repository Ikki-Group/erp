import React from 'react'

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

import { paymentApi } from '@/features/payment'
import type { PaymentDto } from '@/features/payment'
import { PaymentFormDialog } from '@/features/payment/components'

export const Route = createFileRoute('/_app/finance/payments')({ component: PaymentsPage })

const ch = createColumnHelper<PaymentDto>()

const columns = [
	ch.accessor('id', {
		header: 'ID',
		cell: ({ row }) => <span className="font-medium">PAY-{row.original.id}</span>,
	}),
	ch.accessor('referenceNo', {
		header: 'No. Referensi',
		cell: ({ row }) => <span>{row.original.referenceNo || '-'}</span>,
	}),
	ch.accessor('type', {
		header: 'Tipe',
		cell: ({ row }) => {
			const type = row.original.type
			if (type === 'receivable') return <BadgeDot variant="success-outline">Pemasukan</BadgeDot>
			return <BadgeDot variant="destructive-outline">Pengeluaran</BadgeDot>
		},
	}),
	ch.accessor('method', {
		header: 'Metode',
		cell: ({ row }) => {
			const method = row.original.method
			const methodLabels: Record<string, string> = {
				cash: 'Tunai',
				bank_transfer: 'Transfer Bank',
				credit_card: 'Kartu Kredit',
				debit_card: 'Kartu Debit',
				e_wallet: 'E-Wallet',
			}
			return <span>{methodLabels[method] || method}</span>
		},
	}),
	ch.accessor('amount', {
		header: 'Jumlah',
		cell: ({ row }) => (
			<span className="font-medium text-right block">
				Rp {row.original.amount.toLocaleString('id-ID')}
			</span>
		),
	}),
	ch.accessor('date', {
		header: 'Tanggal',
		cell: ({ row }) => toDateTimeStamp(row.original.date.toISOString()),
	}),
]

function PaymentsPage() {
	const [showPaymentDialog, setShowPaymentDialog] = React.useState(false)

	const { data: paymentsData, isLoading } = useQuery(paymentApi.list.query({ page: 1, limit: 100 }))

	const payments = paymentsData?.data ?? []
	const rowCount = paymentsData?.meta?.total ?? 0

	const table = useDataTable({
		columns,
		data: payments,
		pageCount: Math.ceil(rowCount / 100),
		rowCount,
		ds: { pagination: { limit: 100, page: 1 }, search: '', filters: {} } as any,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader title="Pembayaran" description="Kelola seluruh pembayaran Anda di sini." />
			<Page.Content>
				<DataTableCard
					title="Daftar Pembayaran"
					table={table as any}
					isLoading={isLoading}
					recordCount={rowCount}
					action={
						<Button size="sm" onClick={() => setShowPaymentDialog(true)}>
							<PlusIcon className="mr-2 h-4 w-4" /> Buat Pembayaran
						</Button>
					}
				/>
			</Page.Content>
			<PaymentFormDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} />
		</Page>
	)
}
