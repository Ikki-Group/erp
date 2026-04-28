import {
	BanknoteIcon,
	BarChart3Icon,
	BookOpenIcon,
	BoxIcon,
	CirclePileIcon,
	FactoryIcon,
	LayoutDashboardIcon,
	PackageIcon,
	Settings2Icon,
	ShoppingBagIcon,
	ShoppingBasketIcon,
	ShoppingCartIcon,
	UsersIcon,
	WarehouseIcon,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export interface AppMenu {
	title: string
	href: string
	icon?: LucideIcon
	isHide?: boolean
	isActive?: boolean
	badge?: number
	children?: Array<Omit<AppMenu, 'children' | 'icon'>>
}

export interface AppMenuGroup {
	label: string
	items: Array<AppMenu>
}

export interface AppMenuCounts {
	inventoryAlerts?: number
}

export function getAppMenu(pathname: string, counts: AppMenuCounts = {}): Array<AppMenuGroup> {
	return [
		{
			label: 'Ringkasan',
			items: [
				{ title: 'Dashboard', href: '/', icon: LayoutDashboardIcon, isActive: pathname === '/' },
				{
					title: 'Analitik & Laporan',
					href: '/analytics',
					icon: BarChart3Icon,
					children: [
						{
							title: 'Laporan Penjualan',
							href: '/analytics/sales',
							isActive: pathname === '/analytics/sales',
						},
						{
							title: 'Laporan Produksi',
							href: '/analytics/production',
							isActive: pathname === '/analytics/production',
						},
						{
							title: 'Laporan Keuangan',
							href: '/analytics/finance',
							isActive: pathname === '/analytics/finance',
						},
					],
				},
			],
		},
		{
			label: 'Penjualan',
			items: [
				{
					title: 'Penjualan',
					href: '/sales',
					icon: ShoppingCartIcon,
					children: [
						{
							title: 'Transaksi Penjualan',
							href: '/sales/orders',
							isActive: pathname.startsWith('/sales/orders'),
						},
						{
							title: 'Daftar Pelanggan',
							href: '/sales/customers',
							isActive: pathname.startsWith('/sales/customers'),
						},
					],
				},
				{
					title: 'Integrasi POS',
					href: '/moka',
					icon: ShoppingBasketIcon,
					children: [
						{
							title: 'Monitoring Moka',
							href: '/moka/monitoring',
							isActive: pathname.startsWith('/moka/monitoring'),
						},
						{
							title: 'Sinkronisasi Produk',
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
						},
						{
							title: 'Mutasi Stok',
							href: '/inventory/transactions',
							isActive: pathname.startsWith('/inventory/transactions'),
						},
					],
				},
			],
		},
		{
			label: 'Produksi',
			items: [
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
			],
		},
		{
			label: 'Keuangan',
			items: [
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
					],
				},
			],
		},
		{
			label: 'SDM & Payroll',
			items: [
				{
					title: 'Karyawan & Payroll',
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
						{
							title: 'Penggajian (Payroll)',
							href: '/hr/payroll',
							isActive: pathname.startsWith('/hr/payroll'),
						},
					],
				},
			],
		},
		{
			label: 'Master Data',
			items: [
				{
					title: 'Katalog Produk',
					href: '/product',
					icon: PackageIcon,
					isActive: pathname === '/product',
				},
				{
					title: 'Bahan Baku',
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
				{
					title: 'Lokasi & Outlet',
					href: '/location',
					icon: WarehouseIcon,
					isActive: pathname.startsWith('/location'),
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
					isActive: pathname === '/settings',
				},
				{ title: 'Bantuan', href: '/docs', icon: BookOpenIcon },
			],
		},
	]
}
