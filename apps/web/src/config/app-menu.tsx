import {
	ArchiveIcon,
	BanknoteIcon,
	BarChart3Icon,
	BeakerIcon,
	BookOpenIcon,
	CogIcon,
	LayoutDashboardIcon,
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
			items: [
				{ title: 'Dashboard', href: '/', icon: LayoutDashboardIcon, isActive: pathname === '/' },
			],
		},
		{
			label: 'Laporan',
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
			label: 'Operasional',
			items: [
				{
					title: 'Inventory',
					href: '/inventory',
					icon: PackageIcon,
					isActive: pathname.startsWith('/inventory'),
					children: [
						{
							title: 'Ringkasan Stok',
							href: '/inventory',
							isActive: pathname === '/inventory',
						},
						{
							title: 'Pergerakan Stok',
							href: '/inventory/movements',
							isActive: pathname === '/inventory/movements',
						},
						{
							title: 'Stock Opname',
							href: '/inventory/opname',
							isActive: pathname === '/inventory/opname',
						},
						{
							title: 'Penyesuaian Stok',
							href: '/inventory/adjustments',
							isActive: pathname === '/inventory/adjustments',
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
							title: 'Pembelian',
							href: '/procurement/purchases',
							isActive: pathname === '/procurement/purchases',
						},
						{
							title: 'Transfer Antar Lokasi',
							href: '/procurement/transfers',
							isActive: pathname === '/procurement/transfers',
						},
						{
							title: 'Supplier',
							href: '/procurement/suppliers',
							isActive: pathname === '/procurement/suppliers',
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
							href: '/production/bom',
							isActive: pathname === '/production/bom',
						},
						{
							title: 'Proses Produksi',
							href: '/production/orders',
							isActive: pathname === '/production/orders',
						},
					],
				},

				{
					title: 'Penjualan',
					href: '/sales',
					icon: ShoppingBagIcon,
					isActive: pathname.startsWith('/sales'),
					children: [
						{
							title: 'Transaksi',
							href: '/sales/orders',
							isActive: pathname === '/sales/orders',
						},
						{
							title: 'POS',
							href: '/sales/pos',
							isActive: pathname === '/sales/pos',
						},
						{
							title: 'Pelanggan',
							href: '/sales/customers',
							isActive: pathname === '/sales/customers',
						},
					],
				},

				{
					title: 'Produk',
					href: '/products',
					icon: UtensilsCrossedIcon,
					isActive: pathname.startsWith('/products'),
					children: [
						{
							title: 'Daftar Produk',
							href: '/products',
							isActive: pathname === '/products',
						},
						{
							title: 'Kategori Produk',
							href: '/products/categories',
							isActive: pathname === '/products/categories',
						},
					],
				},

				{
					title: 'Bahan Baku',
					href: '/materials',
					icon: BeakerIcon,
					isActive: pathname.startsWith('/materials'),
					children: [
						{
							title: 'Daftar Bahan',
							href: '/materials',
							isActive: pathname === '/materials',
						},
						{
							title: 'Assignment Lokasi',
							href: '/materials/assignments',
							isActive: pathname === '/materials/assignments',
						},
					],
				},
				{
					title: 'Keuangan',
					href: '/finance',
					icon: BanknoteIcon,
					isActive: pathname.startsWith('/finance'),
					children: [
						{
							title: 'Pengeluaran',
							href: '/finance/expenses',
							isActive: pathname === '/finance/expenses',
						},
						{
							title: 'Tagihan',
							href: '/finance/bills',
							isActive: pathname === '/finance/bills',
						},
						{
							title: 'Pembayaran',
							href: '/finance/payments',
							isActive: pathname === '/finance/payments',
						},
					],
				},
			],
		},
		{
			label: 'HR',
			items: [
				{
					title: 'Karyawan',
					href: '/hr/employees',
					icon: UserRoundIcon,
					isActive: pathname.startsWith('/hr'),
					children: [
						{
							title: 'Shift Kerja',
							href: '/hr/shifts',
							isActive: pathname === '/hr/shifts',
						},
						{
							title: 'Absensi',
							href: '/hr/attendance',
							isActive: pathname === '/hr/attendance',
						},
						{
							title: 'Payroll',
							href: '/hr/payroll',
							isActive: pathname === '/hr/payroll',
						},
					],
				},
			],
		},
		{
			label: 'Sistem',
			items: [
				{
					title: 'Pengaturan',
					href: '/settings',
					icon: Settings2Icon,
					isActive: pathname.startsWith('/settings'),
					children: [
						{
							title: 'Lokasi & Outlet',
							href: '/location',
							isActive: pathname.startsWith('/location'),
						},
						{
							title: 'Manajemen User & Role',
							href: '/settings',
							isActive: pathname === '/settings',
						},
						{
							title: 'Audit Trail',
							href: '/settings/audit-trail',
							isActive: pathname.startsWith('/settings/audit-trail'),
						},
					],
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
