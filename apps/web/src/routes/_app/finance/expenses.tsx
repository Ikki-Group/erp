import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'

import { FlameIcon, SearchIcon, TagIcon } from 'lucide-react'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { useDataTable } from '@/hooks/use-data-table'
import { expenditureApi } from '@/features/finance/api'
import { ExpenditureDialog } from '@/features/finance/components/expenditure-dialog'
import type { ExpenditureDto } from '@/features/finance/dto/expenditure.dto'

export const Route = createFileRoute('/_app/finance/expenses')({ component: FinanceExpensesPage })

const ch = createColumnHelper<ExpenditureDto>()

const columns = [
	ch.accessor('id', {
		header: 'Ref ID',
		size: 100,
		cell: ({ row }) => <span className="font-mono text-muted-foreground">EXP-{row.original.id.toString().padStart(6, '0')}</span>,
	}),
	ch.accessor('date', {
		header: 'Tanggal',
		size: 120,
		cell: ({ row }) => (
			<span className="text-sm font-medium">
				{toDateTimeStamp(row.original.date.toString()).split(',')[0]}
			</span>
		),
	}),
	ch.accessor('title', {
		header: 'Keterangan Biaya',
		cell: ({ row }) => (
			<div className="flex flex-col gap-0.5">
				<span className="font-semibold text-foreground/90">{row.original.title}</span>
				<span className="text-xs text-muted-foreground flex items-center gap-1">
					<TagIcon className="size-3" /> {row.original.type}
				</span>
			</div>
		),
	}),
	ch.accessor('status', {
		header: 'Status',
		cell: ({ row }) => {
			if (row.original.status === 'PAID')
				return <BadgeDot variant="success-outline">Sudah Dibayar</BadgeDot>
			if (row.original.status === 'PENDING')
				return <BadgeDot variant="warning-outline">Draft / Tertunda</BadgeDot>
			return <BadgeDot variant="error-outline">{row.original.status}</BadgeDot>
		},
	}),
	ch.accessor('amount', {
		header: 'Total Biaya',
		cell: ({ row }) => (
			<span className="font-mono font-medium tracking-tight tabular-nums block text-right pr-4 text-foreground/90">
				Rp {Number(row.original.amount).toLocaleString('id-ID')}
			</span>
		),
	}),
]

function FinanceExpensesPage() {
	const [search, setSearch] = React.useState('')

	const { data: expenditures = [], isLoading } = useQuery({
		queryKey: ['finance', 'expenditure', 'list', search],
		queryFn: () => expenditureApi.list({ search }),
		select: (res) => res.data,
	})

	const table = useDataTable({
		columns,
		data: expenditures,
		pageCount: 1,
		rowCount: expenditures.length,
		ds: { pagination: { limit: 50, page: 1 }, search, filters: {} } as any,
	})

	const totalBulanIni = expenditures
		.filter(e => e.status === 'PAID')
		.reduce((acc, curr) => acc + Number(curr.amount), 0)

	return (
		<Page>
			<Page.BlockHeader
				title="Pengeluaran (Expenses)"
				description="Pencatatan biaya operasional perusahaan seperti utilitas, transportasi, hingga pemasaran."
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards Dashboard */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card className="lg:col-span-1">
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Pengeluaran (Bulan Ini)
							</Card.Title>
							<FlameIcon className="h-4 w-4 text-rose-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-3xl font-bold font-mono tracking-tight text-rose-600">
								Rp {totalBulanIni.toLocaleString('id-ID')}
							</div>
							<p className="text-xs text-muted-foreground mt-1">Excludes Tertunda</p>
						</Card.Content>
					</Card>
				</div>

				{/* Action & Filter Bar */}
				<Card className="rounded-2xl shadow-sm border-muted/60">
					<div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
							<div className="flex flex-col gap-1.5 min-w-[300px]">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Pencarian Biaya
								</label>
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Cari keterangan pengeluaran..."
										className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-1.5 sm:self-center">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">
								Aksi
							</label>
							<ExpenditureDialog />
						</div>
					</div>
				</Card>

				{/* Main Table */}
				<div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
					<DataTableCard
						title="Riwayat Pengeluaran Operasional"
						table={table as any}
						isLoading={isLoading}
						recordCount={expenditures.length}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
