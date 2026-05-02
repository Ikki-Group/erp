import { createFileRoute } from '@tanstack/react-router'

import { ArrowDownRightIcon, ArrowUpRightIcon, SearchIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import {
	createColumnHelper,
	currencyColumn,
	dateColumn,
	customColumn,
} from '@/components/reui/data-grid/data-grid-columns'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/_app/finance/ledger-ar-ap')({ component: FinanceArApPage })

// Mock Data AP/AR
const mockArAp = [
	{
		id: 'INV-0012',
		type: 'AR',
		partner: 'PT. Laris Manis',
		date: new Date('2026-03-01'),
		dueDate: new Date('2026-03-15'),
		amount: 14500000,
		paid: 14500000,
		status: 'PAID',
	},
	{
		id: 'INV-0013',
		type: 'AR',
		partner: 'Toko Berkah',
		date: new Date('2026-03-05'),
		dueDate: new Date('2026-03-20'),
		amount: 5000000,
		paid: 0,
		status: 'UNPAID',
	},
	{
		id: 'PO-2603-001',
		type: 'AP',
		partner: 'BCA (Cicilan Mesin)',
		date: new Date('2026-03-01'),
		dueDate: new Date('2026-03-25'),
		amount: 8000000,
		paid: 0,
		status: 'UNPAID',
	},
	{
		id: 'PO-2603-002',
		type: 'AP',
		partner: 'PT. Sumber Pangan',
		date: new Date('2026-03-05'),
		dueDate: new Date('2026-03-20'),
		amount: 20000000,
		paid: 5000000,
		status: 'PARTIAL',
	},
]

type ArApType = (typeof mockArAp)[0]
const ch = createColumnHelper<ArApType>()

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
	const table = useDataTable({
		columns,
		data: mockArAp,
		pageCount: 1,
		rowCount: mockArAp.length,
		ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
	})

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Buku Piutang & Hutang (AR/AP)"
				description="Kelola tagihan pelanggan yang belum lunas (AR) dan tagihan vendor yang harus Anda bayar (AP)."
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards Dashboard */}
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
								Rp 5.000.000
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
								Rp 23.000.000
							</div>
							<p className="text-xs text-rose-600/80 mt-1">Uang yang harus dibayarkan</p>
						</Card.Content>
					</Card>
				</div>

				{/* Action & Filter Bar */}
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
									/>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-1.5 sm:self-center">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">
								Aksi
							</label>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="secondary"
									className="h-10 border shadow-none font-medium text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700"
								>
									+ Buat Tagihan Masuk (AR)
								</Button>
								<Button
									size="sm"
									variant="secondary"
									className="h-10 border shadow-none font-medium text-rose-700 hover:bg-rose-500/10 hover:text-rose-700"
								>
									+ Catat Hutang (AP)
								</Button>
							</div>
						</div>
					</div>
				</Card>

				{/* Main Table */}
				<div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
					<DataTableCard
						title="Daftar Tagihan"
						table={table as any}
						isLoading={false}
						recordCount={mockArAp.length}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
