import {
  BarChart3Icon,
  BoxIcon,
  CirclePileIcon,
  ClipboardListIcon,
  FactoryIcon,
  HomeIcon,
  LayoutTemplateIcon,
  MapPinIcon,
  PackageIcon,
  Settings2Icon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UsersIcon,
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
        {
          title: 'Dashboard',
          href: '/',
          icon: HomeIcon,
          isActive: pathname === '/',
        },
        {
          title: 'Analitik & Laporan',
          href: '/analytics',
          icon: BarChart3Icon,
          isHide: false,
          children: [
            {
              title: 'Laporan Stok',
              href: '/analytics/stock',
              isActive: pathname === '/analytics/stock',
            },
            {
              title: 'Laporan Produksi',
              href: '/analytics/production',
              isActive: pathname === '/analytics/production',
            },
          ],
        },
      ],
    },
    {
      label: 'Operasional',
      items: [
        {
          title: 'Penjualan',
          href: '/sales',
          icon: ShoppingCartIcon,
          children: [
            {
              title: 'Pesanan Penjualan',
              href: '/sales/orders',
              isActive: pathname.startsWith('/sales/orders'),
            },
            {
              title: 'Pelanggan',
              href: '/sales/customers',
              isActive: pathname.startsWith('/sales/customers'),
            },
          ],
        },
        {
          title: 'Pembelian',
          href: '/procurement',
          icon: ShoppingBagIcon,
          children: [
            {
              title: 'Pesanan Pembelian',
              href: '/procurement/orders',
              isActive: pathname.startsWith('/procurement/orders'),
            },
            {
              title: 'Supplier',
              href: '/procurement/suppliers',
              isActive: pathname.startsWith('/procurement/suppliers'),
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
      ],
    },
    {
      label: 'Logistik',
      items: [
        {
          title: 'Inventori',
          href: '/inventory',
          icon: BoxIcon,
          isActive: pathname.startsWith('/inventory'),
          children: [
            {
              title: 'Summary Stok',
              href: '/inventory/summary',
              isActive: pathname.startsWith('/inventory/summary'),
            },
            {
              title: 'Riwayat Transaksi',
              href: '/inventory/transactions',
              isActive: pathname === '/inventory/transactions',
            },
            {
              title: 'Penyesuaian (Adj)',
              href: '/inventory/transactions/adjustment',
              isActive: pathname.startsWith(
                '/inventory/transactions/adjustment'
              ),
            },
            {
              title: 'Transfer Barang',
              href: '/inventory/transactions/transfer',
              isActive: pathname.startsWith('/inventory/transactions/transfer'),
            },
          ],
        },
        {
          title: 'Bahan Baku',
          href: '/materials',
          icon: CirclePileIcon,
          isActive: pathname.startsWith('/materials'),
          children: [
            {
              title: 'Daftar Bahan Baku',
              href: '/materials',
              isActive: pathname === '/materials',
            },
            {
              title: 'Stok per Lokasi',
              href: '/materials/stock',
              isActive: pathname.startsWith('/materials/stock'),
            },
            {
              title: 'Ledger Stok',
              href: '/materials/ledger',
              isActive: pathname.startsWith('/materials/ledger'),
            },
          ],
        },
      ],
    },
    {
      label: 'Data Master',
      items: [
        {
          title: 'Produk',
          href: '/products',
          icon: PackageIcon,
          isActive: pathname.startsWith('/products'),
          children: [
            {
              title: 'Daftar Produk',
              href: '/products',
              isActive: pathname === '/products',
            },
            {
              title: 'Kategori Produk',
              href: '/products/category',
              isActive: pathname === '/products/category',
            },
            {
              title: 'Jenis Penjualan',
              href: '/products/sales-type',
              isActive: pathname === '/products/sales-type',
            },
          ],
        },
        {
          title: 'Konfigurasi Bahan',
          href: '/materials/master',
          icon: ClipboardListIcon,
          children: [
            {
              title: 'Kategori Bahan',
              href: '/materials/category',
              isActive: pathname.startsWith('/materials/category'),
            },
            {
              title: 'Satuan (UoM)',
              href: '/materials/uom',
              isActive: pathname.startsWith('/materials/uom'),
            },
          ],
        },
        {
          title: 'Lokasi & Gudang',
          href: '/locations',
          icon: MapPinIcon,
          isActive: pathname.startsWith('/locations'),
        },
      ],
    },
    {
      label: 'Sistem',
      items: [
        {
          title: 'Manajemen User',
          href: '/settings/user',
          icon: UsersIcon,
          isActive: pathname.startsWith('/settings/user'),
        },
        {
          title: 'Pengaturan App',
          href: '/settings',
          icon: Settings2Icon,
          isActive:
            pathname.startsWith('/settings') &&
            !pathname.startsWith('/settings/user'),
        },
      ],
    },
    {
      label: 'Bantuan',
      items: [
        {
          title: 'Dokumentasi',
          href: '/docs',
          icon: ClipboardListIcon,
        },
        {
          title: 'Examples',
          href: '/examples',
          icon: LayoutTemplateIcon,
          isActive: pathname.startsWith('/examples'),
          children: [
            {
              title: 'Table Layout',
              href: '/examples/table',
              isActive: pathname.startsWith('/examples/table'),
            },
            {
              title: 'Form Layout',
              href: '/examples/form',
              isActive: pathname.startsWith('/examples/form'),
            },
            {
              title: 'Detail Layout',
              href: '/examples/detail',
              isActive: pathname.startsWith('/examples/detail'),
            },
          ],
        },
      ],
    },
  ]
}
