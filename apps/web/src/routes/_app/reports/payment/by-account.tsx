import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { LandmarkIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

import { paymentReportApi } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/payment/by-account')({
	component: PaymentByAccountReport,
})

function PaymentByAccountReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data, isLoading } = useQuery(paymentReportApi.byAccount.query(filter))

	const items = data?.data?.data ?? []

	const totalAmount = items.reduce((sum, i) => sum + Number(i.totalAmount), 0)

	const ds = useDataTableState()
	const table = useDataTable({
		columns: [
			{
				accessorKey: 'accountCode',
				header: 'Kode',
				size: 120,
				cell: ({ row }) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.original.accountCode}
					</span>
				),
			},
			{ accessorKey: 'accountName', header: 'Nama Akun', size: 300 },
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
		],
		data: items,
		pageCount: 1,
		rowCount: items.length,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Pembayaran per Akun"
				description="Ringkasan transaksi pembayaran yang dikelompokkan berdasarkan akun keuangan."
			/>
			<Page.Content className="flex flex-col gap-6">
				<Card>
					<Card.Content className="pt-6">
						<ReportDateFilter value={filter} onChange={setFilter} showGroupBy={false} />
					</Card.Content>
				</Card>

				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Transaksi
							</Card.Title>
							<LandmarkIcon className="h-4 w-4 text-blue-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight">
								Rp {(totalAmount / 1_000_000).toFixed(1)}M
							</div>
						</Card.Content>
					</Card>
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Akun Aktif
							</Card.Title>
							<LandmarkIcon className="h-4 w-4 text-violet-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight">{items.length}</div>
						</Card.Content>
					</Card>
				</div>

				<DataTableCard
					title="Detail per Akun"
					table={table as any}
					isLoading={isLoading}
					recordCount={items.length}
				/>
			</Page.Content>
		</Page>
	)
}
