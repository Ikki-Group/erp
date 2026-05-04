import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { TrendingUpIcon, ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

import { paymentReportApi } from '@/features/reporting'
import { ReportDateFilter, useReportDateRange } from '@/features/reporting/components'

export const Route = createFileRoute('/_app/reports/payment/over-time')({
	component: PaymentOverTimeReport,
})

function PaymentOverTimeReport() {
	const [filter, setFilter] = useReportDateRange()

	const { data, isLoading } = useQuery(paymentReportApi.overTime.query(filter))

	const items = data?.data?.data ?? []

	const totalPayable = items.reduce((sum, i) => sum + Number(i.payableAmount), 0)
	const totalReceivable = items.reduce((sum, i) => sum + Number(i.receivableAmount), 0)
	const total = items.reduce((sum, i) => sum + Number(i.totalAmount), 0)

	const ds = useDataTableState()
	const table = useDataTable({
		columns: [
			{
				accessorKey: 'date',
				header: 'Tanggal',
				size: 160,
				cell: ({ row }) => (
					<span className="font-mono text-xs text-muted-foreground">
						{toDateTimeStamp(row.original.date.toString()).split(',')[0]}
					</span>
				),
			},
			{
				accessorKey: 'payableAmount',
				header: 'Kas Keluar',
				size: 180,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums text-red-500">
						Rp {Number(row.original.payableAmount).toLocaleString('id-ID')}
					</span>
				),
			},
			{
				accessorKey: 'receivableAmount',
				header: 'Kas Masuk',
				size: 180,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums text-emerald-600">
						Rp {Number(row.original.receivableAmount).toLocaleString('id-ID')}
					</span>
				),
			},
			{
				accessorKey: 'totalAmount',
				header: 'Total',
				size: 180,
				cell: ({ row }) => (
					<span className="font-bold text-right block tabular-nums">
						Rp {Number(row.original.totalAmount).toLocaleString('id-ID')}
					</span>
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
				title="Tren Pembayaran"
				description="Analisis pembayaran masuk dan keluar berdasarkan waktu."
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
								Total Kas Masuk
							</Card.Title>
							<ArrowUpRightIcon className="h-4 w-4 text-emerald-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight">
								Rp {(totalReceivable / 1_000_000).toFixed(1)}M
							</div>
						</Card.Content>
					</Card>
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Kas Keluar
							</Card.Title>
							<ArrowDownRightIcon className="h-4 w-4 text-red-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight">
								Rp {(totalPayable / 1_000_000).toFixed(1)}M
							</div>
						</Card.Content>
					</Card>
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Net
							</Card.Title>
							<TrendingUpIcon className="h-4 w-4 text-blue-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight">
								Rp {(total / 1_000_000).toFixed(1)}M
							</div>
						</Card.Content>
					</Card>
				</div>

				<DataTableCard
					title="Detail per Tanggal"
					table={table as any}
					isLoading={isLoading}
					recordCount={items.length}
				/>
			</Page.Content>
		</Page>
	)
}
