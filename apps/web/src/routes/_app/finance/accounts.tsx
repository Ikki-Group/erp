import { createFileRoute } from '@tanstack/react-router'
import { PlusIcon, WalletIcon, BuildingIcon, LandmarkIcon, SearchIcon } from 'lucide-react'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { Card } from '@/components/ui/card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import {
	createColumnHelper,
	currencyColumn,
	statusColumn,
	textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataTable } from '@/hooks/use-data-table'

export const Route = createFileRoute('/_app/finance/accounts')({ component: FinanceAccountsPage })

// Mock Data COA (Chart of Accounts)
const mockAccounts = [
	{
		id: 1,
		code: '1-1001',
		name: 'Kas Kecil (Petty Cash)',
		type: 'ASSET',
		isGroup: false,
		balance: 2500000,
	},
	{ id: 2, code: '1-1002', name: 'Bank BCA', type: 'ASSET', isGroup: false, balance: 125000000 },
	{
		id: 3,
		code: '1-2001',
		name: 'Piutang Usaha',
		type: 'ASSET',
		isGroup: false,
		balance: 14500000,
	},
	{
		id: 4,
		code: '2-1001',
		name: 'Hutang Dagang',
		type: 'LIABILITY',
		isGroup: false,
		balance: 28000000,
	},
	{
		id: 5,
		code: '3-1001',
		name: 'Modal Disetor',
		type: 'EQUITY',
		isGroup: false,
		balance: 500000000,
	},
	{
		id: 6,
		code: '4-1001',
		name: 'Pendapatan Penjualan',
		type: 'REVENUE',
		isGroup: false,
		balance: 85000000,
	},
	{
		id: 7,
		code: '5-1001',
		name: 'Biaya Bahan Baku',
		type: 'EXPENSE',
		isGroup: false,
		balance: 35000000,
	},
]

type AccountType = (typeof mockAccounts)[0]
const ch = createColumnHelper<AccountType>()

const columns = [
	ch.accessor('code', textColumn({ header: 'Kode Akun', size: 120 })),
	ch.accessor('name', textColumn({ header: 'Nama Akun', size: 250 })),
	ch.accessor(
		'type',
		statusColumn({
			header: 'Kategori',
			render: (value: string) => {
				if (value === 'ASSET') return <BadgeDot variant="success-outline">Aset</BadgeDot>
				if (value === 'LIABILITY')
					return <BadgeDot variant="destructive-outline">Kewajiban</BadgeDot>
				if (value === 'EQUITY') return <BadgeDot variant="primary-outline">Ekuitas</BadgeDot>
				if (value === 'REVENUE') return <BadgeDot variant="success">Pendapatan</BadgeDot>
				return <BadgeDot variant="warning-outline">Beban</BadgeDot>
			},
			size: 150,
		}),
	),
	ch.accessor(
		'balance',
		currencyColumn({
			header: 'Saldo Berjalan',
			render: (value: number | string | null | undefined, row: AccountType) => {
				const color =
					row.type === 'LIABILITY' || row.type === 'EXPENSE' ? 'text-rose-600' : 'text-foreground'
				return (
					<span
						className={`font-mono font-medium tracking-tight tabular-nums block text-right pr-4 ${color}`}
					>
						Rp {Number(value).toLocaleString('id-ID')}
					</span>
				)
			},
			size: 180,
		}),
	),
]

function FinanceAccountsPage() {
	const table = useDataTable({
		columns,
		data: mockAccounts,
		pageCount: 1,
		rowCount: mockAccounts.length,
		ds: { pagination: { limit: 10, page: 1 }, search: '', filters: {} } as any,
	})

	return (
		<Page>
			<Page.BlockHeader
				title="Daftar Akun (Chart of Accounts)"
				description="Kelola hierarki akun Kas, Bank, Aset, hingga Biaya Operasional untuk pembukuan."
			/>
			<Page.Content className="flex flex-col gap-6">
				{/* Metric Cards Dashboard */}
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Kas & Bank
							</Card.Title>
							<WalletIcon className="h-4 w-4 text-emerald-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight text-emerald-600">
								Rp 127.500.000
							</div>
							<p className="text-xs text-muted-foreground mt-1">Saldo aktif siap pakai</p>
						</Card.Content>
					</Card>

					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Piutang Berjalan
							</Card.Title>
							<LandmarkIcon className="h-4 w-4 text-blue-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight">Rp 14.500.000</div>
							<p className="text-xs text-muted-foreground mt-1">Hutang pelanggan ke perusahaan</p>
						</Card.Content>
					</Card>

					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Liabilitas (Hutang)
							</Card.Title>
							<BuildingIcon className="h-4 w-4 text-rose-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-2xl font-bold font-mono tracking-tight text-rose-600">
								Rp 28.000.000
							</div>
							<p className="text-xs text-rose-600/80 mt-1">Kewajiban pembayaran aktif</p>
						</Card.Content>
					</Card>
				</div>

				{/* Action & Filter Bar */}
				<Card className="rounded-2xl shadow-sm border-muted/60">
					<div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
							<div className="flex flex-col gap-1.5 min-w-[300px]">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Cari Akun
								</label>
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Ketik nama atau kode akun..."
										className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background"
									/>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-1.5 sm:self-center">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">
								Aksi
							</label>
							<Button size="sm" className="h-10 shadow-md font-medium">
								<PlusIcon className="size-4 mr-2" /> Tambah Akun Baru
							</Button>
						</div>
					</div>
				</Card>

				{/* Main Table */}
				<div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
					<DataTableCard
						title="Daftar Buku Akun"
						table={table as any}
						isLoading={false}
						recordCount={mockAccounts.length}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
