import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { ArrowDownRightIcon, ArrowUpRightIcon, SearchIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import {
	currencyColumn,
	dateColumn,
	customColumn,
} from '@/components/reui/data-grid/data-grid-columns'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { purchaseOrderApi } from '@/features/purchasing'
import { salesOrderApi } from '@/features/sales'

export const Route = createFileRoute('/_app/reports/finance/ledger-ar-ap')({ component: FinanceArApPage })

interface ArApEntry {
	id: string
	type: 'AR' | 'AP'
	partner: string
	date: Date
	dueDate: Date
	amount: number
	paid: number
	status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'VOID'
}

const ch = createColumnHelper<ArApEntry>()

const columns = [
	ch.accessor(
		'id',
		customColumn({
			header: 'No. Tagihan',
			cell: (value, row) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-semibold text-foreground/90">{value}</span>
					<span className="text-xs text-muted-foreground font-medium">{row.partner}</span>
				</div>
			),
			size: 150,
		}),
	),
	ch.accessor(
		'type',
		customColumn({
			header: 'Jenis Tagihan',
			cell: (value) => {
				if (value === 'AR') return <BadgeDot variant="primary-outline">Piutang (AR)</BadgeDot>
				return <BadgeDot variant="destructive-outline">Hutang (AP)</BadgeDot>
			},
			size: 130,
		}),
	),
	ch.accessor('dueDate', dateColumn({ header: 'Jatuh Tempo', size: 140 })),
	ch.accessor('amount', currencyColumn({ header: 'Total Tagihan', size: 160 })),
	ch.accessor(
		'paid',
		currencyColumn({
			header: 'Sisa Tagihan (Belum Lunas)',
			render: (value, row) => {
				const sisa = Number(row.amount) - Number(value)
				if (sisa === 0)
					return (
						<span className="block text-right pr-4 text-muted-foreground/30 font-medium">
							Lunas
						</span>
					)
				return (
					<span className="font-mono font-bold tracking-tight tabular-nums block text-right pr-4 text-rose-600">
						Rp {sisa.toLocaleString('id-ID')}
					</span>
				)
			},
			size: 200,
		}),
	),
]

function FinanceArApPage() {
	const [search, setSearch] = useState('')

	const { data: salesData, isLoading: isLoadingSales } = useQuery(
		salesOrderApi.list.query({ q: search, page: 1, limit: 100 }),
	)
	const { data: purchaseData, isLoading: isLoadingPurchases } = useQuery(
		purchaseOrderApi.list.query({ q: search, page: 1, limit: 100 }),
	)

	const salesOrders = salesData?.data ?? []
	const purchaseOrders = purchaseData?.data ?? []

	const entries = useMemo(() => {
		const result: ArApEntry[] = []

		for (const so of salesOrders) {
			const amount = Number(so.totalAmount)
			const status = so.status === 'closed' ? 'PAID' : so.status === 'void' ? 'VOID' : 'UNPAID'
			const paid = status === 'PAID' ? amount : 0
			const date =
				so.transactionDate instanceof Date ? so.transactionDate : new Date(so.transactionDate)
			const dueDate = new Date(date)
			dueDate.setDate(dueDate.getDate() + 14)

			result.push({
				id: `SO-${so.id}`,
				type: 'AR',
				partner: so.customerId ? `Customer #${so.customerId}` : 'Walk-in',
				date,
				dueDate,
				amount,
				paid,
				status,
			})
		}

		for (const po of purchaseOrders) {
			const amount = Number(po.totalAmount)
			const status = po.status === 'closed' ? 'PAID' : po.status === 'void' ? 'VOID' : 'UNPAID'
			const paid = status === 'PAID' ? amount : 0
			const date =
				po.transactionDate instanceof Date ? po.transactionDate : new Date(po.transactionDate)
			const dueDate = po.expectedDeliveryDate
				? po.expectedDeliveryDate instanceof Date
					? po.expectedDeliveryDate
					: new Date(po.expectedDeliveryDate)
				: new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000)

			result.push({
				id: `PO-${po.id}`,
				type: 'AP',
				partner: `Supplier #${po.supplierId}`,
				date,
				dueDate,
				amount,
				paid,
				status,
			})
		}

		return result.sort((a, b) => b.date.getTime() - a.date.getTime())
	}, [salesOrders, purchaseOrders])

	const totalAr = entries
		.filter((e) => e.type === 'AR' && e.status === 'UNPAID')
		.reduce((sum, e) => sum + (e.amount - e.paid), 0)
	const totalAp = entries
		.filter((e) => e.type === 'AP' && e.status === 'UNPAID')
		.reduce((sum, e) => sum + (e.amount - e.paid), 0)

	const ds = useDataTableState()
	const table = useDataTable({
		columns,
		data: entries,
		pageCount: 1,
		rowCount: entries.length,
		ds,
	})

	const isLoading = isLoadingSales || isLoadingPurchases

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Buku Piutang & Hutang (AR/AP)"
				description="Kelola tagihan pelanggan yang belum lunas (AR) dan tagihan vendor yang harus Anda bayar (AP)."
			/>
			<Page.Content className="flex flex-col gap-6">
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Piutang Belum Lunas (Masuk)
							</Card.Title>
							<ArrowDownRightIcon className="h-4 w-4 text-emerald-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-3xl font-bold font-mono tracking-tight text-emerald-600">
								Rp {totalAr.toLocaleString('id-ID')}
							</div>
							<p className="text-xs text-muted-foreground mt-1">Uang yang akan diterima</p>
						</Card.Content>
					</Card>

					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Hutang Belum Lunas (Keluar)
							</Card.Title>
							<ArrowUpRightIcon className="h-4 w-4 text-rose-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-3xl font-bold font-mono tracking-tight text-rose-600">
								Rp {totalAp.toLocaleString('id-ID')}
							</div>
							<p className="text-xs text-rose-600/80 mt-1">Uang yang harus dibayarkan</p>
						</Card.Content>
					</Card>
				</div>

				<Card className="rounded-2xl shadow-sm border-muted/60">
					<div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
							<div className="flex flex-col gap-1.5 min-w-[300px]">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Pencarian Invoice
								</label>
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Cari No. Tagihan atau Pelanggan/Vendor..."
										className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>
								</div>
							</div>
						</div>
					</div>
				</Card>

				<div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
					<DataTableCard
						title="Daftar Tagihan"
						table={table as any}
						isLoading={isLoading}
						recordCount={entries.length}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
