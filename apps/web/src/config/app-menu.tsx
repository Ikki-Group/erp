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
          title: 'Laporan & Analitik',
          href: '/analytics',
          icon: BarChart3Icon,
          children: [
            { title: 'Laporan Penjualan', href: '/analytics/sales', isActive: pathname === '/analytics/sales' },
            { title: 'Laporan Stok', href: '/analytics/stock', isActive: pathname === '/analytics/stock' },
            { title: 'Laporan Keuangan', href: '/analytics/finance', isActive: pathname === '/analytics/finance' },
          ],
        },
      ],
    },
    {
      label: 'Komersial & Outlet',
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
          title: 'Integrasi POS (Moka)',
          href: '/moka',
          icon: ShoppingBasketIcon,
          children: [
            { title: 'Monitoring Moka', href: '/moka/monitoring', isActive: pathname.startsWith('/moka/monitoring') },
            { title: 'Sync Produk Moka', href: '/moka/sync', isActive: pathname.startsWith('/moka/sync') },
          ],
        },
      ],
    },
    {
      label: 'Manajemen Stok',
      items: [
        {
          title: 'Inventori & Logistik',
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
          href: '/procurement',
          icon: ShoppingBagIcon,
          children: [
            {
              title: 'Pesanan Pembelian',
              href: '/procurement/orders',
              isActive: pathname.startsWith('/procurement/orders'),
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
      label: 'Operasional',
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
            { title: 'Resep & BOM', href: '/production/recipes', isActive: pathname.startsWith('/production/recipes') },
          ],
        },
        {
          title: 'Keuangan',
          href: '/finance',
          icon: BanknoteIcon,
          children: [
            { title: 'Kas & Bank', href: '/finance/accounts', isActive: pathname.startsWith('/finance/accounts') },
            { title: 'Hutang & Piutang', href: '/finance/ledger', isActive: pathname.startsWith('/finance/ledger') },
            {
              title: 'Pengeluaran (Biaya)',
              href: '/finance/expenses',
              isActive: pathname.startsWith('/finance/expenses'),
            },
          ],
        },
        {
          title: 'Karyawan',
          href: '/employees',
          icon: UsersIcon,
          children: [
            { title: 'Daftar Staff', href: '/employees/list', isActive: pathname.startsWith('/employees/list') },
            {
              title: 'Absensi & Jadwal',
              href: '/employees/attendance',
              isActive: pathname.startsWith('/employees/attendance'),
            },
          ],
        },
      ],
    },
    {
      label: 'Data Master (Global)',
      items: [
        { title: 'Katalog Produk', href: '/product', icon: PackageIcon, isActive: pathname.startsWith('/product') },
        {
          title: 'Bahan Baku Global',
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
          href: '/settings/iam',
          icon: FingerprintIcon,
          isActive: pathname.startsWith('/settings/iam'),
        },
        { title: 'Pengaturan App', href: '/settings', icon: Settings2Icon, isActive: pathname === '/settings' },
        { title: 'Bantuan', href: '/docs', icon: BookOpenIcon },
      ],
    },
  ]
}
