import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import { FileTextIcon, SearchIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { toDateTimeStamp } from '@/lib/formatter'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { accountApi } from '@/features/finance'
import { expenditureApi } from '@/features/finance'
import { paymentApi } from '@/features/payment'

export const Route = createFileRoute('/_app/reports/finance/ledger')({
	component: RouteComponent,
})

interface LedgerEntry {
	id: string
	date: Date
	ref: string
	account: string
	note: string
	debit: number
	credit: number
}

const ch = createColumnHelper<LedgerEntry>()

const columns = [
	ch.accessor('date', {
		header: 'Tanggal Transaksi',
		size: 150,
		cell: ({ row }) => (
			<span className="text-muted-foreground text-sm">
				{toDateTimeStamp(row.original.date.toISOString())}
			</span>
		),
	}),
	ch.accessor('id', {
		header: 'No. Jurnal & Ref',
		cell: ({ row }) => (
			<div className="flex flex-col gap-0.5">
				<span className="font-semibold text-foreground/90">{row.original.id}</span>
				<span className="text-xs text-muted-foreground font-mono">{row.original.ref}</span>
			</div>
		),
	}),
	ch.accessor('account', {
		header: 'Akun Terkait',
		size: 250,
		cell: ({ row }) => <span className="font-medium text-foreground">{row.original.account}</span>,
	}),
	ch.accessor('debit', {
		header: 'Debit',
		size: 150,
		cell: ({ row }) => {
			if (row.original.debit === 0)
				return <span className="block text-right pr-4 text-muted-foreground/30">-</span>
			return (
				<span className="font-mono font-medium tracking-tight tabular-nums block text-right pr-4 text-emerald-600">
					Rp {row.original.debit.toLocaleString('id-ID')}
				</span>
			)
		},
	}),
	ch.accessor('credit', {
		header: 'Kredit',
		size: 150,
		cell: ({ row }) => {
			if (row.original.credit === 0)
				return <span className="block text-right pr-4 text-muted-foreground/30">-</span>
			return (
				<span className="font-mono font-medium tracking-tight tabular-nums block text-right pr-4 text-rose-600">
					Rp {row.original.credit.toLocaleString('id-ID')}
				</span>
			)
		},
	}),
]

function RouteComponent() {
	const [search, setSearch] = useState('')

	const dateFrom = useMemo(() => new Date(new Date().setDate(1)), [])
	const dateTo = useMemo(() => new Date(), [])

	const { data: accountsData, isLoading: isLoadingAccounts } = useQuery(
		accountApi.list.query({ q: '', page: 1, limit: 100 }),
	)
	const { data: paymentsData, isLoading: isLoadingPayments } = useQuery(
		paymentApi.list.query({ dateFrom, dateTo, q: search, page: 1, limit: 100 }),
	)
	const { data: expendituresData, isLoading: isLoadingExpenditures } = useQuery(
		expenditureApi.list.query({ q: search, page: 1, limit: 100 }),
	)

	const accounts = accountsData?.data ?? []
	const payments = paymentsData?.data ?? []
	const expenditures = expendituresData?.data ?? []

	const accountMap = useMemo(() => {
		const map = new Map<number, string>()
		for (const a of accounts) {
			map.set(a.id, `[${a.code}] ${a.name}`)
		}
		return map
	}, [accounts])

	const ledgerEntries = useMemo(() => {
		const entries: LedgerEntry[] = []

		for (const e of expenditures.filter((x) => x.status === 'PAID')) {
			const sourceName = accountMap.get(e.sourceAccountId) ?? `Akun #${e.sourceAccountId}`
			const targetName = accountMap.get(e.targetAccountId) ?? `Akun #${e.targetAccountId}`
			const amount = Number(e.amount)
			const date = e.date instanceof Date ? e.date : new Date(e.date)

			entries.push({
				id: `EXP-${e.id}`,
				date,
				ref: e.title,
				account: targetName,
				note: `Pengeluaran: ${e.title}`,
				debit: amount,
				credit: 0,
			})
			entries.push({
				id: `EXP-${e.id}`,
				date,
				ref: e.title,
				account: sourceName,
				note: `Pengeluaran: ${e.title}`,
				debit: 0,
				credit: amount,
			})
		}

		for (const p of payments) {
			const accountName = accountMap.get(p.accountId) ?? `Akun #${p.accountId}`
			const amount = Number(p.amount)
			const date = p.date instanceof Date ? p.date : new Date(p.date)
			const ref = p.referenceNo ?? `${p.method}`

			if (p.type === 'receivable') {
				entries.push({
					id: `PAY-${p.id}`,
					date,
					ref,
					account: accountName,
					note: `Pembayaran Masuk: ${ref}`,
					debit: amount,
					credit: 0,
				})
			} else {
				entries.push({
					id: `PAY-${p.id}`,
					date,
					ref,
					account: accountName,
					note: `Pembayaran Keluar: ${ref}`,
					debit: 0,
					credit: amount,
				})
			}
		}

		return entries.sort((a, b) => b.date.getTime() - a.date.getTime())
	}, [expenditures, payments, accountMap])

	const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0)
	const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0)
	const balance = totalDebit - totalCredit

	const ds = useDataTableState()
	const table = useDataTable({
		columns,
		data: ledgerEntries,
		pageCount: 1,
		rowCount: ledgerEntries.length,
		ds,
	})

	const isLoading = isLoadingAccounts || isLoadingPayments || isLoadingExpenditures

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Buku Besar & Jurnal"
				description="Pencatatan rekam jejak setiap mutasi masuk dan keluar dari semua akun secara kronologis."
			/>
			<Page.Content className="flex flex-col gap-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card className="lg:col-span-2 bg-gradient-to-br from-primary/5 to-transparent">
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-primary">
								Keseimbangan (Balance Check)
							</Card.Title>
							<FileTextIcon className="h-4 w-4 text-primary" />
						</Card.Header>
						<Card.Content>
							<div className="flex items-end gap-3">
								<div className="text-2xl font-bold font-mono tracking-tight text-primary">
									{balance === 0 ? 'Balanced' : 'Unbalanced'}
								</div>
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Selisih Rp {Math.abs(balance).toLocaleString('id-ID')}
							</p>
						</Card.Content>
					</Card>

					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Arus Debit (Bulan Ini)
							</Card.Title>
							<TrendingUpIcon className="h-4 w-4 text-emerald-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight text-emerald-600">
								Rp {(totalDebit / 1_000_000).toFixed(1)}M
							</div>
						</Card.Content>
					</Card>

					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Arus Kredit (Bulan Ini)
							</Card.Title>
							<TrendingDownIcon className="h-4 w-4 text-rose-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight text-rose-600">
								Rp {(totalCredit / 1_000_000).toFixed(1)}M
							</div>
						</Card.Content>
					</Card>
				</div>

				<Card className="rounded-2xl shadow-sm border-muted/60">
					<div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
							<div className="flex flex-col gap-1.5 min-w-[300px]">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Pencarian Jurnal
								</label>
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Cari No Jurnal, Referensi, atau Akun..."
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
						title="Riwayat Jurnal Transaksi"
						table={table as any}
						isLoading={isLoading}
						recordCount={ledgerEntries.length}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
