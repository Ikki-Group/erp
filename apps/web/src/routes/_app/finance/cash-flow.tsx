import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ArrowDownLeftIcon, ArrowUpRightIcon, WalletIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

import { expenditureApi } from '@/features/finance'
import { paymentApi, PaymentTypeDto } from '@/features/payment'

export const Route = createFileRoute('/_app/finance/cash-flow')({ component: FinanceCashFlow })

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

function FinanceCashFlow() {
	const [search, setSearch] = useState('')

	const dateFrom = useMemo(() => new Date(new Date().setDate(1)), [])
	const dateTo = useMemo(() => new Date(), [])

	const { data: paymentsData, isLoading: isLoadingPayments } = useQuery(
		paymentApi.list.query({
			dateFrom,
			dateTo,
			q: search,
			page: 1,
			limit: 100,
		}),
	)
	const { data: expendituresData, isLoading: isLoadingExpenditures } = useQuery(
		expenditureApi.list.query({
			q: search,
			page: 1,
			limit: 100,
		}),
	)

	const payments = paymentsData?.data ?? []
	const expenditures = expendituresData?.data ?? []

	const inflows = payments
		.filter((p) => p.type === 'receivable')
		.map((p) => ({
			id: `P-${p.id}`,
			date: p.date,
			description: p.referenceNo ?? `Pembayaran ${p.method}`,
			category: 'Pembayaran Masuk',
			inflow: Number(p.amount),
			outflow: 0,
		}))

	const paymentOutflows = payments
		.filter((p) => p.type === 'payable')
		.map((p) => ({
			id: `P-${p.id}`,
			date: p.date,
			description: p.referenceNo ?? `Pembayaran ${p.method}`,
			category: 'Pembayaran Keluar',
			inflow: 0,
			outflow: Number(p.amount),
		}))

	const expenseOutflows = expenditures
		.filter((e) => e.status === 'PAID')
		.map((e) => ({
			id: `E-${e.id}`,
			date: e.date,
			description: e.title,
			category: `Pengeluaran ${e.type}`,
			inflow: 0,
			outflow: Number(e.amount),
		}))

	const allEntries = [...inflows, ...paymentOutflows, ...expenseOutflows].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	)

	const totalInflow = allEntries.reduce((sum, e) => sum + e.inflow, 0)
	const totalOutflow = allEntries.reduce((sum, e) => sum + e.outflow, 0)
	const netFlow = totalInflow - totalOutflow

	const ds = useDataTableState()
	const table = useDataTable({
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
				accessorKey: 'id',
				header: 'Ref ID',
				size: 120,
				cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
			},
			{ accessorKey: 'category', header: 'Kategori', size: 180 },
			{ accessorKey: 'description', header: 'Keterangan', size: 300 },
			{
				accessorKey: 'inflow',
				header: 'Masuk',
				size: 160,
				cell: ({ row }) =>
					row.original.inflow > 0 ? (
						<span className="font-medium text-right block tabular-nums text-emerald-600">
							+Rp {row.original.inflow.toLocaleString('id-ID')}
						</span>
					) : (
						<span className="text-right block text-muted-foreground">-</span>
					),
			},
			{
				accessorKey: 'outflow',
				header: 'Keluar',
				size: 160,
				cell: ({ row }) =>
					row.original.outflow > 0 ? (
						<span className="font-medium text-right block tabular-nums text-red-500">
							-Rp {row.original.outflow.toLocaleString('id-ID')}
						</span>
					) : (
						<span className="text-right block text-muted-foreground">-</span>
					),
			},
		],
		data: allEntries,
		pageCount: 1,
		rowCount: allEntries.length,
		ds,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Arus Kas"
				description={`Periode ${toDateTimeStamp(dateFrom.toISOString()).split(',')[0]} - ${toDateTimeStamp(dateTo.toISOString()).split(',')[0]}`}
			/>
			<Page.Content className="flex flex-col gap-6">
				<div className="grid gap-4 md:grid-cols-3">
					<MetricCard
						title="Total Kas Masuk"
						value={`Rp ${totalInflow.toLocaleString('id-ID')}`}
						sub={`${inflows.length} transaksi`}
						icon={ArrowDownLeftIcon}
						color="text-emerald-500"
					/>
					<MetricCard
						title="Total Kas Keluar"
						value={`Rp ${totalOutflow.toLocaleString('id-ID')}`}
						sub={`${paymentOutflows.length + expenseOutflows.length} transaksi`}
						icon={ArrowUpRightIcon}
						color="text-red-500"
					/>
					<MetricCard
						title="Saldo Net"
						value={`Rp ${netFlow.toLocaleString('id-ID')}`}
						sub={netFlow >= 0 ? 'Surplus' : 'Defisit'}
						icon={WalletIcon}
						color={netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}
					/>
				</div>

				<DataTableCard
					title="Detail Transaksi Arus Kas"
					table={table as any}
					isLoading={isLoadingPayments || isLoadingExpenditures}
					recordCount={allEntries.length}
					toolbar={
						<div className="relative max-w-sm">
							<input
								placeholder="Cari transaksi..."
								className="h-10 w-full rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					}
				/>
			</Page.Content>
		</Page>
	)
}
