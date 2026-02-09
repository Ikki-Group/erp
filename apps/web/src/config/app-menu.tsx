import {
  LayoutDashboardIcon,
  LucideIcon,
  PackageIcon,
  Settings2Icon,
} from 'lucide-react'

export interface AppMenu {
  title: string
  href: string
  icon: LucideIcon
  isHide?: boolean
  isActive?: boolean
  children?: Omit<AppMenu, 'children' | 'icon'>[]
}

export function getAppMenu(pathname: string): AppMenu[] {
  const menus: AppMenu[] = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboardIcon,
      isActive: pathname === '/',
      isHide: false,
    },
    {
      title: 'Products',
      href: '/products',
      icon: PackageIcon,
      isActive: pathname.startsWith('/products'),
      isHide: false,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings2Icon,
      isActive: pathname.startsWith('/settings'),
      isHide: false,
      children: [
        {
          title: 'Users',
          href: '/settings/users',
          isActive: pathname.startsWith('/settings/users'),
        },
        {
          title: 'Roles',
          href: '/settings/roles',
          isActive: pathname.startsWith('/settings/roles'),
        },
      ],
    },
  ]

  return menus.reduce<AppMenu[]>((acc, menu) => {
    if (menu.isHide) return acc
    return [...acc, menu]
  }, [])
}
