import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ArrowDownLeftIcon, ArrowUpRightIcon, LandmarkIcon, WalletIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

import { financeReportApi } from '@/features/reporting'

export const Route = createFileRoute('/_app/analytics/finance')({ component: AnalyticsFinance })

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

function AnalyticsFinance() {
	const dateFrom = useMemo(() => new Date(new Date().setDate(1)), [])
	const dateTo = useMemo(() => new Date(), [])

	const { data: cashFlowData, isLoading: isLoadingCashFlow } = useQuery(
		financeReportApi.cashFlow.query({ dateFrom, dateTo, groupBy: 'day' }),
	)
	const { data: accountData, isLoading: isLoadingAccounts } = useQuery(
		financeReportApi.accountBalances.query({ dateFrom, dateTo }),
	)
	const { data: expenditureData, isLoading: isLoadingExpenditure } = useQuery(
		financeReportApi.expenditureByCategory.query({ dateFrom, dateTo }),
	)

	const cashFlow = cashFlowData?.data?.data ?? []
	const accounts = accountData?.data?.data ?? []
	const expenditures = expenditureData?.data?.data ?? []

	const totalInflow = cashFlow.reduce((sum, r) => sum + Number(r.inflow), 0)
	const totalOutflow = cashFlow.reduce((sum, r) => sum + Number(r.outflow), 0)
	const netCashFlow = totalInflow - totalOutflow

	const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

	const accountDs = useDataTableState()
	const accountTable = useDataTable({
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
				accessorKey: 'balance',
				header: 'Saldo',
				size: 160,
				cell: ({ row }) => (
					<span
						className={`font-medium text-right block tabular-nums ${Number(row.original.balance) < 0 ? 'text-red-500' : ''}`}
					>
						Rp {Number(row.original.balance).toLocaleString('id-ID')}
					</span>
				),
			},
		],
		data: accounts,
		pageCount: 1,
		rowCount: accounts.length,
		ds: accountDs,
	})

	const expenditureDs = useDataTableState()
	const expenditureTable = useDataTable({
		columns: [
			{ accessorKey: 'categoryName', header: 'Kategori', size: 300 },
			{
				accessorKey: 'totalAmount',
				header: 'Total Pengeluaran',
				size: 180,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums">
						Rp {Number(row.original.totalAmount).toLocaleString('id-ID')}
					</span>
				),
			},
			{
				accessorKey: 'percentage',
				header: '%',
				size: 100,
				cell: ({ row }) => (
					<BadgeDot variant="primary-outline">{row.original.percentage}%</BadgeDot>
				),
			},
		],
		data: expenditures,
		pageCount: 1,
		rowCount: expenditures.length,
		ds: expenditureDs,
	})

	const flowDs = useDataTableState()
	const flowTable = useDataTable({
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
			{
				accessorKey: 'inflow',
				header: 'Masuk',
				size: 160,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums text-emerald-600">
						+Rp {Number(row.original.inflow).toLocaleString('id-ID')}
					</span>
				),
			},
			{
				accessorKey: 'outflow',
				header: 'Keluar',
				size: 160,
				cell: ({ row }) => (
					<span className="font-medium text-right block tabular-nums text-red-500">
						-Rp {Number(row.original.outflow).toLocaleString('id-ID')}
					</span>
				),
			},
			{
				accessorKey: 'net',
				header: 'Net',
				size: 160,
				cell: ({ row }) => (
					<span
						className={`font-medium text-right block tabular-nums ${Number(row.original.net) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
					>
						Rp {Number(row.original.net).toLocaleString('id-ID')}
					</span>
				),
			},
		],
		data: cashFlow,
		pageCount: 1,
		rowCount: cashFlow.length,
		ds: flowDs,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Laporan Keuangan"
				description={`Periode ${toDateTimeStamp(dateFrom.toISOString()).split(',')[0]} - ${toDateTimeStamp(dateTo.toISOString()).split(',')[0]}`}
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<MetricCard
						title="Kas Masuk"
						value={`Rp ${(totalInflow / 1_000_000).toFixed(1)}M`}
						sub={`${cashFlow.length} data points`}
						icon={ArrowDownLeftIcon}
						color="text-emerald-500"
					/>
					<MetricCard
						title="Kas Keluar"
						value={`Rp ${(totalOutflow / 1_000_000).toFixed(1)}M`}
						sub="Bulan ini"
						icon={ArrowUpRightIcon}
						color="text-red-500"
					/>
					<MetricCard
						title="Net Cash Flow"
						value={`Rp ${(netCashFlow / 1_000_000).toFixed(1)}M`}
						sub={netCashFlow >= 0 ? 'Surplus' : 'Defisit'}
						icon={WalletIcon}
						color={netCashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}
					/>
					<MetricCard
						title="Total Saldo Akun"
						value={`Rp ${(totalBalance / 1_000_000).toFixed(1)}M`}
						sub={`${accounts.length} akun aktif`}
						icon={LandmarkIcon}
						color="text-blue-500"
					/>
				</div>

				{/* Account Balances */}
				<DataTableCard
					title="Saldo per Akun"
					table={accountTable as any}
					isLoading={isLoadingAccounts}
					recordCount={accounts.length}
				/>

				{/* Expenditure by Category */}
				<DataTableCard
					title="Pengeluaran per Kategori"
					table={expenditureTable as any}
					isLoading={isLoadingExpenditure}
					recordCount={expenditures.length}
				/>

				{/* Cash Flow Timeline */}
				<DataTableCard
					title="Arus Kas Harian"
					table={flowTable as any}
					isLoading={isLoadingCashFlow}
					recordCount={cashFlow.length}
				/>
			</Page.Content>
		</Page>
	)
}
