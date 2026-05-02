import { createFileRoute, Link } from '@tanstack/react-router'

import {
	ArchiveIcon,
	BarChart3Icon,
	TrendingUpIcon,
	TruckIcon,
	WalletIcon,
} from 'lucide-react'

import { Page } from '@/components/layout/page'

import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/_app/reports/')({ component: ReportsOverviewPage })

const reportGroups = [
	{
		title: 'Laporan Penjualan',
		description: 'Analisis pendapatan, performa produk, dan channel penjualan.',
		icon: TrendingUpIcon,
		color: 'text-emerald-500',
		bg: 'bg-emerald-500/10',
		items: [
			{ title: 'Pendapatan', href: '/reports/sales/revenue' },
			{ title: 'Performa Produk', href: '/reports/sales/products' },
			{ title: 'Channel Penjualan', href: '/reports/sales/channels' },
		],
	},
	{
		title: 'Laporan Inventory',
		description: 'Ringkasan stok, pergerakan, dan nilai inventaris.',
		icon: ArchiveIcon,
		color: 'text-blue-500',
		bg: 'bg-blue-500/10',
		items: [
			{ title: 'Ringkasan Stok', href: '/reports/inventory/stock' },
			{ title: 'Pergerakan Stok', href: '/reports/inventory/movements' },
			{ title: 'Nilai Stok', href: '/reports/inventory/stock-value' },
		],
	},
	{
		title: 'Laporan Keuangan',
		description: 'Arus kas, pengeluaran, dan saldo akun.',
		icon: WalletIcon,
		color: 'text-violet-500',
		bg: 'bg-violet-500/10',
		items: [
			{ title: 'Arus Kas', href: '/reports/finance/cash-flow' },
			{ title: 'Pengeluaran', href: '/reports/finance/expenses' },
			{ title: 'Saldo Akun', href: '/reports/finance/account-balances' },
		],
	},
	{
		title: 'Laporan Pembayaran',
		description: 'Metode bayar, tren waktu, dan per akun.',
		icon: BarChart3Icon,
		color: 'text-amber-500',
		bg: 'bg-amber-500/10',
		items: [
			{ title: 'Per Metode', href: '/reports/payment/by-method' },
			{ title: 'Tren Waktu', href: '/reports/payment/over-time' },
			{ title: 'Per Akun', href: '/reports/payment/by-account' },
		],
	},
]

function ReportsOverviewPage() {
	return (
		<Page>
			<Page.BlockHeader
				title="Laporan & Analitik"
				description="Pusat laporan bisnis untuk pengambilan keputusan berbasis data."
			/>
			<Page.Content className="grid gap-6 md:grid-cols-2">
				{reportGroups.map((group) => (
					<Card key={group.title}>
						<Card.Header className="pb-3">
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-lg ${group.bg}`}>
									<group.icon className={`h-5 w-5 ${group.color}`} />
								</div>
								<div>
									<Card.Title className="text-base">{group.title}</Card.Title>
									<p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
								</div>
							</div>
						</Card.Header>
						<Card.Content>
							<div className="grid gap-2">
								{group.items.map((item) => (
									<Link
										key={item.href}
										to={item.href}
										className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
									>
										<span>{item.title}</span>
										<TruckIcon className="h-3.5 w-3.5 text-muted-foreground rotate-[-90deg]" />
									</Link>
								))}
							</div>
						</Card.Content>
					</Card>
				))}
			</Page.Content>
		</Page>
	)
}
