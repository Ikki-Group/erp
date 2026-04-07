import {
  BanknoteIcon,
  BarChart3Icon,
  BookOpenIcon,
  BoxIcon,
  CirclePileIcon,
  FactoryIcon,
  FingerprintIcon,
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
  children?: Array<Omit<AppMenu, 'children' | 'icon'>>
}

export interface AppMenuGroup {
  label: string
  items: Array<AppMenu>
}

export function getAppMenu(pathname: string): Array<AppMenuGroup> {
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
            { title: 'Laporan Penjualan', href: '/analytics/sales', isActive: pathname === '/analytics/sales' },
            { title: 'Laporan Stok', href: '/analytics/stock', isActive: pathname === '/analytics/stock' },
            {
              title: 'Laporan Produksi',
              href: '/analytics/production',
              isActive: pathname === '/analytics/production',
            },
            { title: 'Laporan Keuangan', href: '/analytics/finance', isActive: pathname === '/analytics/finance' },
          ],
        },
      ],
    },
    {
      label: 'Operasional & Stok',
      items: [
        {
          title: 'Inventori',
          href: '/inventory',
          icon: BoxIcon,
          children: [
            {
              title: 'Stok per Lokasi',
              href: '/inventory/summary',
              isActive: pathname.startsWith('/inventory/summary'),
            },
            {
              title: 'Alokasi Bahan',
              href: '/inventory/assignment',
              isActive: pathname.startsWith('/inventory/assignment'),
            },
            {
              title: 'Transfer & Mutasi',
              href: '/inventory/transactions',
              isActive: pathname.startsWith('/inventory/transactions'),
            },
            {
              title: 'Penyesuaian (Opname)',
              href: '/inventory/adjustment',
              isActive: pathname.startsWith('/inventory/adjustment'),
            },
          ],
        },
        {
          title: 'Pembelian (PO)',
          href: '/purchasing',
          icon: ShoppingBagIcon,
          children: [
            {
              title: 'Pesanan Pembelian',
              href: '/purchasing/orders',
              isActive: pathname.startsWith('/purchasing/orders'),
            },
            {
              title: 'Daftar Supplier',
              href: '/purchasing/suppliers',
              isActive: pathname.startsWith('/purchasing/suppliers'),
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
            { title: 'Resep & BOM', href: '/production/recipes', isActive: pathname.startsWith('/production/recipes') },
          ],
        },
      ],
    },
    {
      label: 'Penjualan & Outlet',
      items: [
        {
          title: 'Penjualan',
          href: '/sales',
          icon: ShoppingCartIcon,
          children: [
            { title: 'Transaksi Penjualan', href: '/sales/orders', isActive: pathname.startsWith('/sales/orders') },
            { title: 'Daftar Pelanggan', href: '/sales/customers', isActive: pathname.startsWith('/sales/customers') },
          ],
        },
        {
          title: 'Integrasi POS',
          href: '/moka',
          icon: ShoppingBasketIcon,
          children: [
            { title: 'Monitoring Moka', href: '/moka/monitoring', isActive: pathname.startsWith('/moka/monitoring') },
            { title: 'Sinkronisasi Produk', href: '/moka/sync', isActive: pathname.startsWith('/moka/sync') },
          ],
        },
      ],
    },
    {
      label: 'Keuangan & SDM',
      items: [
        {
          title: 'Keuangan',
          href: '/finance',
          icon: BanknoteIcon,
          children: [
            { title: 'Kas & Bank', href: '/finance/accounts', isActive: pathname.startsWith('/finance/accounts') },
            { title: 'Buku Besar & Jurnal', href: '/finance/ledger', isActive: pathname.startsWith('/finance/ledger') },
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
        {
          title: 'Karyawan & Payroll',
          href: '/hr',
          icon: UsersIcon,
          children: [
            { title: 'Daftar Staff', href: '/hr/employees', isActive: pathname.startsWith('/hr/employees') },
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
      label: 'Data Master',
      items: [
        { title: 'Katalog Produk', href: '/product', icon: PackageIcon, isActive: pathname.startsWith('/product') },
        {
          title: 'Bahan Baku',
          href: '/material',
          icon: CirclePileIcon,
          children: [
            { title: 'Daftar Bahan', href: '/material', isActive: pathname === '/material' },
            { title: 'Kategori & UoM', href: '/material/config', isActive: pathname.startsWith('/material/config') },
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
          title: 'Akses & Keamanan',
          href: '/iam',
          icon: FingerprintIcon,
          isActive: pathname.startsWith('/iam'),
        },
        { title: 'Pengaturan', href: '/settings', icon: Settings2Icon, isActive: pathname === '/settings' },
        { title: 'Bantuan', href: '/docs', icon: BookOpenIcon },
      ],
    },
  ]
}
