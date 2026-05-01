import {
	BanknoteIcon,
	BarChart3Icon,
	BookOpenIcon,
	BoxIcon,
	CirclePileIcon,
	CurrencyIcon,
	FactoryIcon,
	LayoutDashboardIcon,
	PackageIcon,
	Settings2Icon,
	ShoppingBagIcon,
	ShoppingBasketIcon,
	ShoppingCartIcon,
	UsersIcon,
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
	counts: AppMenuCounts = {},
	context: AppMenuContext = {},
): Array<AppMenuGroup> {
	const { locationType } = context

	return [
		{
			items: [
				{ title: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
				{
					title: 'Laporan',
					href: '/reports',
					icon: BarChart3Icon,
					children: [
						{ title: 'Laporan Penjualan', href: '/reports/sales' },
						{ title: 'Laporan Produksi', href: '/reports/production' },
						{ title: 'Laporan Keuangan', href: '/reports/finance' },
					],
				},
				{
					title: 'Keuangan',
					href: '/finance',
					icon: BanknoteIcon,
					children: [
						{
							title: 'Kas & Bank',
							href: '/finance/accounts',
							isActive: pathname.startsWith('/finance/accounts'),
						},
						{
							title: 'Buku Besar & Jurnal',
							href: '/finance/ledger',
							isActive: pathname.startsWith('/finance/ledger'),
						},
						{
							title: 'Hutang & Piutang',
							href: '/finance/ledger-ar-ap',
							isActive: pathname.startsWith('/finance/ledger-ar-ap'),
						},
						{
							title: 'Pengeluaran (Biaya)',
							href: '/finance/expenses',
							isActive: pathname.startsWith('/finance/expenses'),
						},
						{
							title: 'Laporan Laba Rugi',
							href: '/finance/profit-loss',
							isActive: pathname.startsWith('/finance/profit-loss'),
						},
						{
							title: 'Arus Kas (Cash Flow)',
							href: '/finance/cash-flow',
							isActive: pathname.startsWith('/finance/cash-flow'),
						},
					],
				},
			],
		},
		{
			// TODO: saran
			label: 'Penjualan',
			isHide: locationType !== 'store',
			items: [
				{
					title: 'Penjualan',
					href: '/sales',
					icon: ShoppingCartIcon,
					isHide: locationType !== 'store',
					children: [
						{
							title: 'Transaksi Penjualan',
							href: '/sales/orders',
							isActive: pathname.startsWith('/sales/orders'),
						},
						{
							title: 'Invoice & Surat Jalan',
							href: '/sales/invoices',
							isActive: pathname.startsWith('/sales/invoices'),
						},
						{
							title: 'Sales Type',
							href: '/product/sales-type',
							isActive: pathname.startsWith('/product/sales-type'),
						},
					],
				},
				{
					title: 'Produk',
					href: '/product',
					icon: PackageIcon,
					isHide: locationType !== 'store',
					children: [
						{
							title: 'Daftar Produk',
							href: '/product',
							isActive: pathname === '/product',
						},
						{
							title: 'Kategori Produk',
							href: '/product/category',
							isActive: pathname.startsWith('/product/category'),
						},
					],
				},
				{
					title: 'CRM',
					href: '/product',
					icon: PackageIcon,
					children: [
						{
							title: 'Daftar Pelanggan',
							href: '/sales/customers',
							isActive: pathname.startsWith('/sales/customers'),
						},
					],
				},
				{
					title: 'Integrasi POS Moka',
					href: '/moka',
					icon: ShoppingBasketIcon,
					isHide: locationType !== 'store',
					children: [
						{
							title: 'Konfigurasi',
							href: '/moka/configuration',
							isActive: pathname.startsWith('/moka/configuration'),
						},
						{
							title: 'Monitoring Sinkronisasi',
							href: '/moka/monitoring',
							isActive: pathname.startsWith('/moka/monitoring'),
						},
						{
							title: 'Sinkronisasi Manual',
							href: '/moka/sync',
							isActive: pathname.startsWith('/moka/sync'),
						},
					],
				},
			],
		},
		{
			label: 'Pembelian & Supplier',
			items: [
				{
					title: 'Pembelian (PO)',
					href: '/procurement',
					icon: ShoppingBagIcon,
					isHide: locationType === 'store',
					children: [
						{
							title: 'Pesanan Pembelian',
							href: '/procurement/orders',
							isActive: pathname.startsWith('/procurement/orders'),
						},
						{
							title: 'Penerimaan Barang',
							href: '/procurement/receipts',
							isActive: pathname.startsWith('/procurement/receipts'),
						},
						{
							title: 'Daftar Supplier',
							href: '/procurement/suppliers',
							isActive: pathname.startsWith('/procurement/suppliers'),
						},
					],
				},
			],
		},
		{
			label: 'Inventori',
			items: [
				{
					title: 'Inventori',
					href: '/inventory/summary',
					icon: BoxIcon,
					badge: counts.inventoryAlerts ?? undefined,
					children: [
						{
							title: 'Dashboard Stok',
							href: '/inventory/summary',
							isActive: pathname === '/inventory/summary',
						},
						{
							title: 'Alokasi Gudang',
							href: '/inventory/allocation',
							isActive: pathname.startsWith('/inventory/allocation'),
							isHide: locationType === 'store',
						},
						{
							title: 'Semua Mutasi',
							href: '/inventory/transactions',
							isActive: pathname === '/inventory/transactions',
						},
						{
							title: 'Penerimaan Pembelian',
							href: '/inventory/transactions/purchase',
							isActive: pathname === '/inventory/transactions/purchase',
							isHide: locationType === 'store',
						},
						{
							title: 'Transfer Antar Gudang',
							href: '/inventory/transactions/transfer',
							isActive: pathname === '/inventory/transactions/transfer',
							isHide: locationType === 'store',
						},
						{
							title: 'Penggunaan Produksi',
							href: '/inventory/transactions/usage',
							isActive: pathname === '/inventory/transactions/usage',
							isHide: locationType === 'store',
						},
						{
							title: 'Penyesuaian',
							href: '/inventory/transactions/adjustment',
							isActive: pathname === '/inventory/transactions/adjustment',
						},
						{
							title: 'Opname Stok',
							href: '/inventory/transactions/opname',
							isActive: pathname === '/inventory/transactions/opname',
						},
					],
				},
				{
					title: 'Produksi',
					href: '/production',
					icon: FactoryIcon,
					children: [
						{
							title: 'Perintah Kerja (WO)',
							href: '/production/work-orders',
							isActive: pathname.startsWith('/production/work-orders'),
						},
						{
							title: 'Resep & BOM',
							href: '/production/recipes',
							isActive: pathname.startsWith('/production/recipes'),
						},
					],
				},
				{
					title: 'Master Bahan Baku',
					href: '/material',
					icon: CirclePileIcon,
					children: [
						{ title: 'Daftar Bahan', href: '/material', isActive: pathname === '/material' },
						{
							title: 'Kategori',
							href: '/material/category',
							isActive: pathname.startsWith('/material/category'),
						},
						{
							title: 'Satuan (UoM)',
							href: '/material/uom',
							isActive: pathname.startsWith('/material/uom'),
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
					href: '/hr',
					icon: UsersIcon,
					children: [
						{
							title: 'Daftar Staff',
							href: '/hr/employees',
							isActive: pathname.startsWith('/hr/employees'),
						},
						{
							title: 'Absensi & Jadwal',
							href: '/hr/attendance',
							isActive: pathname.startsWith('/hr/attendance'),
						},
					],
				},
				{
					title: 'Payroll',
					href: '/hr/payroll',
					icon: CurrencyIcon,
					isActive: pathname.startsWith('/hr/payroll'),
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
				{ title: 'Bantuan', href: '/docs', icon: BookOpenIcon },
			],
		},
	]
}
