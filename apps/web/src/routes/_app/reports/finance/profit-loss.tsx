import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ArrowDownIcon, ArrowUpIcon, MinusIcon, TrendingUpIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

import { expenditureApi } from '@/features/finance'
import { salesReportApi } from '@/features/reporting'

export const Route = createFileRoute('/_app/reports/finance/profit-loss')({ component: FinanceProfitLoss })

function MetricCard({
	title,
	value,
	sub,
	icon: Icon,
	color,
}: {
	title: string
	value: string
	sub?: string
	icon: React.ElementType
	color: string
}) {
	return (
		<Card>
			<Card.Header className="flex flex-row items-center justify-between pb-2">
				<Card.Title className="text-sm font-medium text-muted-foreground">{title}</Card.Title>
				<Icon className={`h-4 w-4 ${color}`} />
			</Card.Header>
			<Card.Content>
				<div className="text-2xl font-bold font-mono tracking-tight">{value}</div>
				{sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
			</Card.Content>
		</Card>
	)
}

function FinanceProfitLoss() {
	const dateFrom = useMemo(() => new Date(new Date().setDate(1)), [])
	const dateTo = useMemo(() => new Date(), [])

	const { data: revenueData, isLoading: isLoadingRevenue } = useQuery(
		salesReportApi.revenue.query({ dateFrom, dateTo, groupBy: 'month' }),
	)
	const { data: expenditureData, isLoading: isLoadingExpenditure } = useQuery(
		expenditureApi.list.query({ page: 1, limit: 100 }),
	)

	const revenueItems = revenueData?.data?.data ?? []
	const expenses = expenditureData?.data ?? []

	const totalRevenue = revenueItems.reduce((sum, r) => sum + Number(r.revenue), 0)
	const totalExpenses = expenses
		.filter((e) => e.status === 'PAID')
		.reduce((sum, e) => sum + Number(e.amount), 0)
	const netProfit = totalRevenue - totalExpenses
	const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0'

	const revenueDs = useDataTableState()
	const revenueTable = useDataTable({
		columns: [
			{
				accessorKey: 'date',
				header: 'Periode',
				size: 160,
				cell: ({ row }) => (
					<span className="font-mono text-xs text-muted-foreground">
						{toDateTimeStamp(row.original.date.toString()).split(',')[0]}
					</span>
				),
			},
			{
				accessorKey: 'orderCount',
				header: 'Jumlah Order',
				size: 140,
				cell: ({ row }) => (
					<span className="tabular-nums">{row.original.orderCount.toLocaleString('id-ID')}</span>
				),
			},
			{
				accessorKey: 'revenue',
				header: 'Pendapatan',
				size: 180,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums text-emerald-600">
						Rp {Number(row.original.revenue).toLocaleString('id-ID')}
					</span>
				),
			},
		],
		data: revenueItems,
		pageCount: 1,
		rowCount: revenueItems.length,
		ds: revenueDs,
	})

	const expenseDs = useDataTableState()
	const expenseTable = useDataTable({
		columns: [
			{
				accessorKey: 'date',
				header: 'Tanggal',
				size: 140,
				cell: ({ row }) => (
					<span className="font-mono text-xs text-muted-foreground">
						{toDateTimeStamp(row.original.date.toString()).split(',')[0]}
					</span>
				),
			},
			{ accessorKey: 'title', header: 'Keterangan', size: 300 },
			{
				accessorKey: 'type',
				header: 'Jenis',
				size: 140,
				cell: ({ row }) => (
					<span className="text-xs uppercase text-muted-foreground">{row.original.type}</span>
				),
			},
			{
				accessorKey: 'amount',
				header: 'Jumlah',
				size: 180,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums text-red-500">
						Rp {Number(row.original.amount).toLocaleString('id-ID')}
					</span>
				),
			},
		],
		data: expenses.filter((e) => e.status === 'PAID'),
		pageCount: 1,
		rowCount: expenses.filter((e) => e.status === 'PAID').length,
		ds: expenseDs,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Laporan Laba Rugi"
				description={`Periode ${toDateTimeStamp(dateFrom.toISOString()).split(',')[0]} - ${toDateTimeStamp(dateTo.toISOString()).split(',')[0]}`}
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<MetricCard
						title="Total Pendapatan"
						value={`Rp ${(totalRevenue / 1_000_000).toFixed(1)}M`}
						sub={`${revenueItems.length} periode`}
						icon={ArrowUpIcon}
						color="text-emerald-500"
					/>
					<MetricCard
						title="Total Beban"
						value={`Rp ${(totalExpenses / 1_000_000).toFixed(1)}M`}
						sub={`${expenses.filter((e) => e.status === 'PAID').length} transaksi`}
						icon={ArrowDownIcon}
						color="text-red-500"
					/>
					<MetricCard
						title="Laba / Rugi Bersih"
						value={`Rp ${(netProfit / 1_000_000).toFixed(1)}M`}
						sub={netProfit >= 0 ? 'Laba' : 'Rugi'}
						icon={TrendingUpIcon}
						color={netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}
					/>
					<MetricCard
						title="Margin"
						value={`${margin}%`}
						sub="dari pendapatan"
						icon={MinusIcon}
						color="text-blue-500"
					/>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<DataTableCard
						title="Rincian Pendapatan"
						table={revenueTable as any}
						isLoading={isLoadingRevenue}
						recordCount={revenueItems.length}
					/>
					<DataTableCard
						title="Rincian Beban"
						table={expenseTable as any}
						isLoading={isLoadingExpenditure}
						recordCount={expenses.filter((e) => e.status === 'PAID').length}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
