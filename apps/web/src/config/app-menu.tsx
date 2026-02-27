import {
  CirclePileIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  PackageIcon,
  Settings2Icon,
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

export function getAppMenu(pathname: string): Array<AppMenu> {
  const menus: Array<AppMenu> = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboardIcon,
      isActive: pathname === '/',
      isHide: false,
    },
    {
      title: 'Produk',
      href: '/products',
      icon: PackageIcon,
      isActive: pathname.startsWith('/products'),
      isHide: false,
    },
    {
      title: 'Bahan Baku',
      href: '/materials',
      icon: CirclePileIcon,
      isActive: pathname.startsWith('/materials'),
      isHide: false,
      children: [
        {
          title: 'Daftar Bahan Baku',
          href: '/materials',
          isActive: pathname === '/materials',
        },
        {
          title: 'Kategori',
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
      title: 'Pengaturan',
      href: '/settings/user',
      icon: Settings2Icon,
      isActive: pathname.startsWith('/settings'),
      isHide: false,
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
        {
          title: 'Responsive Dashboard',
          href: '/examples/dashboard',
          isActive: pathname.startsWith('/examples/dashboard'),
        },
        {
          title: 'Complex Form',
          href: '/examples/complex-form',
          isActive: pathname.startsWith('/examples/complex-form'),
        },
        {
          title: 'Dialog',
          href: '/examples/dialog',
          isActive: pathname.startsWith('/examples/dialog'),
        },
        {
          title: 'Dialog Form',
          href: '/examples/dialog-form',
          isActive: pathname.startsWith('/examples/dialog-form'),
        },
        {
          title: 'Search Dialog',
          href: '/examples/search',
          isActive: pathname.startsWith('/examples/search'),
        },
        {
          title: 'Details Display',
          href: '/examples/details',
          isActive: pathname.startsWith('/examples/details'),
        },
        {
          title: 'Recharts',
          href: '/examples/charts',
          isActive: pathname.startsWith('/examples/charts'),
        },
        {
          title: 'Layout Primitives',
          href: '/examples/layouts',
          isActive: pathname.startsWith('/examples/layouts'),
        },
        {
          title: 'Page Layouts',
          href: '/examples/page-layouts',
          isActive: pathname.startsWith('/examples/page-layouts'),
        },
        {
          title: 'New Page',
          href: '/examples/page-new',
          isActive: pathname.startsWith('/examples/page-new'),
        },
      ],
    },
  ]

  return menus.reduce<Array<AppMenu>>((acc, menu) => {
    if (menu.isHide) return acc
    return [...acc, menu]
  }, [])
}
