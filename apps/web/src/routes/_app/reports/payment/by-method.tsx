import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { CreditCardIcon, LandmarkIcon, WalletIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

import { paymentReportApi } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/payment/by-method')({
	component: PaymentByMethodReport,
})

const methodIcons: Record<string, React.ElementType> = {
	cash: WalletIcon,
	bank_transfer: LandmarkIcon,
	credit_card: CreditCardIcon,
	debit_card: CreditCardIcon,
	e_wallet: WalletIcon,
}

function PaymentByMethodReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data, isLoading } = useQuery(paymentReportApi.byMethod.query(filter))

	const items = data?.data?.data ?? []

	const ds = useDataTableState()
	const table = useDataTable({
		columns: [
			{
				accessorKey: 'method',
				header: 'Metode',
				size: 200,
				cell: ({ row }) => {
					const Icon = methodIcons[row.original.method] ?? WalletIcon
					return (
						<div className="flex items-center gap-2">
							<Icon className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium capitalize">
								{row.original.method.replace('_', ' ')}
							</span>
						</div>
					)
				},
			},
			{ accessorKey: 'category', header: 'Kategori', size: 160 },
			{
				accessorKey: 'totalAmount',
				header: 'Total',
				size: 180,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums">
						Rp {Number(row.original.totalAmount).toLocaleString('id-ID')}
					</span>
				),
			},
			{
				accessorKey: 'count',
				header: 'Jumlah Transaksi',
				size: 160,
				cell: ({ row }) => (
					<span className="tabular-nums">{row.original.count.toLocaleString('id-ID')}</span>
				),
			},
			{
				accessorKey: 'percentage',
				header: '%',
				size: 100,
				cell: ({ row }) => (
					<span className="tabular-nums text-right block">{row.original.percentage}%</span>
				),
			},
		],
		data: items,
		pageCount: 1,
		rowCount: items.length,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Pembayaran per Metode"
				description="Ringkasan transaksi pembayaran berdasarkan metode yang digunakan."
			/>
			<Page.Content className="flex flex-col gap-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} showGroupBy={false} />
					</Card.Content>
				</Card>

				<DataTableCard
					title="Ringkasan per Metode"
					table={table as any}
					isLoading={isLoading}
					recordCount={items.length}
				/>
			</Page.Content>
		</Page>
	)
}
