import {
	ArchiveIcon,
	BanknoteIcon,
	BarChart3Icon,
	BeakerIcon,
	BookOpenIcon,
	CogIcon,
	LayoutDashboardIcon,
	LogsIcon,
	PackageIcon,
	Settings2Icon,
	ShoppingBagIcon,
	SparklesIcon,
	TrendingUpIcon,
	TruckIcon,
	UserRoundIcon,
	UtensilsCrossedIcon,
	WalletIcon,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export interface AppMenu {
	title: string
	href: string
	icon?: LucideIcon
	isHide?: boolean
	isComingSoon?: boolean
	isActive?: boolean
	badge?: number
	children?: Array<Omit<AppMenu, 'children' | 'icon'>>
}

export interface AppMenuGroup {
	label?: string
	items: Array<AppMenu>
	isHide?: boolean
}

export interface AppMenuCounts {
	inventoryAlerts?: number
}

export interface AppMenuContext {
	locationType?: 'store' | 'warehouse'
}

export function getAppMenu(
	pathname: string,
	_counts: AppMenuCounts = {},
	_context: AppMenuContext = {},
): Array<AppMenuGroup> {
	return [
		{
			label: 'Utama',
			items: [
				{ title: 'Dashboard', href: '/', icon: LayoutDashboardIcon, isActive: pathname === '/' },
			],
		},
		{
			label: 'Operasi',
			items: [
				{
					title: 'Penjualan',
					href: '/sales',
					icon: ShoppingBagIcon,
					isActive: pathname.startsWith('/sales'),
					children: [
						{ title: 'POS', href: '/sales/pos', isActive: pathname === '/sales/pos' },
						{ title: 'Pesanan', href: '/sales/orders', isActive: pathname === '/sales/orders' },
						{ title: 'Invoice', href: '/sales/invoices', isActive: pathname === '/sales/invoices' },
						{
							title: 'Pelanggan',
							href: '/sales/customers',
							isActive: pathname === '/sales/customers',
						},
					],
				},
				{
					title: 'Pengadaan',
					href: '/procurement',
					icon: TruckIcon,
					isActive: pathname.startsWith('/procurement'),
					children: [
						{
							title: 'Pesanan Pembelian',
							href: '/procurement/orders',
							isActive: pathname === '/procurement/orders',
						},
						{
							title: 'Penerimaan Barang',
							href: '/procurement/receipts',
							isActive: pathname === '/procurement/receipts',
						},
						{
							title: 'Supplier',
							href: '/procurement/suppliers',
							isActive: pathname === '/procurement/suppliers',
						},
					],
				},
				{
					title: 'Inventory',
					href: '/inventory',
					icon: PackageIcon,
					isActive: pathname.startsWith('/inventory'),
					children: [
						{
							title: 'Ringkasan Stok',
							href: '/inventory/summary',
							isActive: pathname === '/inventory/summary',
						},
						{
							title: 'Alokasi Stok',
							href: '/inventory/allocation',
							isActive: pathname === '/inventory/allocation',
						},
						{
							title: 'Transaksi',
							href: '/inventory/transactions',
							isActive: pathname.startsWith('/inventory/transactions'),
						},
					],
				},
				{
					title: 'Produksi',
					href: '/production',
					icon: CogIcon,
					isActive: pathname.startsWith('/production'),
					children: [
						{
							title: 'Resep (BOM)',
							href: '/production/recipes',
							isActive: pathname === '/production/recipes',
						},
						{
							title: 'Work Order',
							href: '/production/work-orders',
							isActive: pathname === '/production/work-orders',
						},
					],
				},
			],
		},
		{
			label: 'Produk & Bahan',
			items: [
				{
					title: 'Produk',
					href: '/product',
					icon: UtensilsCrossedIcon,
					isActive: pathname.startsWith('/product'),
					children: [
						{ title: 'Daftar Produk', href: '/product', isActive: pathname === '/product' },
						{
							title: 'Kategori Produk',
							href: '/product/category',
							isActive: pathname === '/product/category',
						},
					],
				},
				{
					title: 'Bahan Baku',
					href: '/material',
					icon: BeakerIcon,
					isActive: pathname.startsWith('/material'),
					children: [
						{ title: 'Daftar Bahan', href: '/material', isActive: pathname === '/material' },
						{
							title: 'Kategori Bahan',
							href: '/material/category',
							isActive: pathname === '/material/category',
						},
						{
							title: 'Satuan (UOM)',
							href: '/material/uom',
							isActive: pathname === '/material/uom',
						},
					],
				},
				{
					title: 'Tipe Penjualan',
					href: '/sales-type',
					icon: ShoppingBagIcon,
					isActive: pathname.startsWith('/sales-type'),
				},
			],
		},
		{
			label: 'Keuangan',
			items: [
				{
					title: 'Keuangan',
					href: '/finance',
					icon: BanknoteIcon,
					isActive: pathname.startsWith('/finance'),
					children: [
						{
							title: 'Akun',
							href: '/finance/accounts',
							isActive: pathname === '/finance/accounts',
						},
						{
							title: 'Pembayaran',
							href: '/finance/payments',
							isActive: pathname === '/finance/payments',
						},
						{
							title: 'Arus Kas',
							href: '/finance/cash-flow',
							isActive: pathname === '/finance/cash-flow',
						},
						{
							title: 'Pengeluaran',
							href: '/finance/expenses',
							isActive: pathname === '/finance/expenses',
						},
						{
							title: 'Buku Besar',
							href: '/finance/ledger',
							isActive: pathname === '/finance/ledger',
						},
						{
							title: 'Piutang & Hutang',
							href: '/finance/ledger-ar-ap',
							isActive: pathname === '/finance/ledger-ar-ap',
						},
						{
							title: 'Laba Rugi',
							href: '/finance/profit-loss',
							isActive: pathname === '/finance/profit-loss',
						},
					],
				},
			],
		},
		{
			label: 'Laporan & Insight',
			items: [
				{
					title: 'Overview',
					href: '/reports',
					icon: BarChart3Icon,
					isActive: pathname.startsWith('/reports'),
				},
				{
					title: 'Laporan Penjualan',
					href: '/reports/sales',
					icon: TrendingUpIcon,
					isActive: pathname.startsWith('/reports/sales'),
					children: [
						{
							title: 'Pendapatan',
							href: '/reports/sales/revenue',
							isActive: pathname === '/reports/sales/revenue',
						},
						{
							title: 'Performa Produk',
							href: '/reports/sales/products',
							isActive: pathname === '/reports/sales/products',
						},
						{
							title: 'Transaksi',
							href: '/reports/sales/transactions',
							isActive: pathname === '/reports/sales/transactions',
						},
						{
							title: 'Channel Penjualan',
							href: '/reports/sales/channels',
							isActive: pathname === '/reports/sales/channels',
						},
					],
				},
				{
					title: 'Laporan Inventory',
					href: '/reports/inventory',
					icon: ArchiveIcon,
					isActive: pathname.startsWith('/reports/inventory'),
					children: [
						{
							title: 'Ringkasan Stok',
							href: '/reports/inventory/stock',
							isActive: pathname === '/reports/inventory/stock',
						},
						{
							title: 'Pergerakan Stok',
							href: '/reports/inventory/movements',
							isActive: pathname === '/reports/inventory/movements',
						},
						{
							title: 'Konsumsi Bahan',
							href: '/reports/inventory/consumption',
							isActive: pathname === '/reports/inventory/consumption',
						},
						{
							title: 'Stock Opname',
							href: '/reports/inventory/opname',
							isActive: pathname === '/reports/inventory/opname',
						},
						{
							title: 'Waste / Kerusakan',
							href: '/reports/inventory/waste',
							isActive: pathname === '/reports/inventory/waste',
						},
					],
				},
				{
					title: 'Laporan Pengadaan',
					href: '/reports/procurement',
					icon: TruckIcon,
					isActive: pathname.startsWith('/reports/procurement'),
					children: [
						{
							title: 'Pembelian',
							href: '/reports/procurement/purchases',
							isActive: pathname === '/reports/procurement/purchases',
						},
						{
							title: 'Supplier',
							href: '/reports/procurement/suppliers',
							isActive: pathname === '/reports/procurement/suppliers',
						},
						{
							title: 'Transfer',
							href: '/reports/procurement/transfers',
							isActive: pathname === '/reports/procurement/transfers',
						},
						{
							title: 'Tren Harga',
							href: '/reports/procurement/costs',
							isActive: pathname === '/reports/procurement/costs',
						},
					],
				},
				{
					title: 'Laporan Keuangan',
					href: '/reports/finance',
					icon: WalletIcon,
					isActive: pathname.startsWith('/reports/finance'),
					children: [
						{
							title: 'Arus Kas',
							href: '/reports/finance/cash-flow',
							isActive: pathname === '/reports/finance/cash-flow',
						},
						{
							title: 'Pengeluaran',
							href: '/reports/finance/expenses',
							isActive: pathname === '/reports/finance/expenses',
						},
						{
							title: 'Tagihan & Hutang',
							href: '/reports/finance/bills',
							isActive: pathname === '/reports/finance/bills',
						},
					],
				},
				{
					title: 'Insight Bisnis',
					href: '/reports/insights',
					icon: SparklesIcon,
					isComingSoon: true,
					isActive: pathname.startsWith('/reports/insights'),
					children: [
						{
							title: 'Profitabilitas',
							href: '/reports/insights/profitability',
							isActive: pathname === '/reports/insights/profitability',
						},
						{
							title: 'Performa Lokasi',
							href: '/reports/insights/location',
							isActive: pathname === '/reports/insights/location',
						},
						{
							title: 'Inventory Turnover',
							href: '/reports/insights/turnover',
							isActive: pathname === '/reports/insights/turnover',
						},
					],
				},
			],
		},
		{
			label: 'People',
			items: [
				{
					title: 'Karyawan',
					href: '/hr/employees',
					icon: UserRoundIcon,
					isActive: pathname.startsWith('/hr'),
					children: [
						{
							title: 'Daftar Karyawan',
							href: '/hr/employees',
							isActive: pathname === '/hr/employees',
						},
						{ title: 'Absensi', href: '/hr/attendance', isActive: pathname === '/hr/attendance' },
						{ title: 'Payroll', href: '/hr/payroll', isActive: pathname === '/hr/payroll' },
					],
				},
			],
		},
		{
			label: 'Sistem',
			items: [
				{
					title: 'Pengaturan',
					href: '/settings/location',
					icon: Settings2Icon,
					isActive:
						pathname.startsWith('/settings') && !pathname.startsWith('/settings/audit-trail'),
				},
				{
					title: 'Audit Trail',
					href: '/settings/audit-trail',
					icon: LogsIcon,
					isActive: pathname.startsWith('/settings/audit-trail'),
				},
				{
					title: 'Bantuan',
					href: '/docs',
					icon: BookOpenIcon,
					isActive: pathname.startsWith('/docs'),
				},
			],
		},
	]
}
