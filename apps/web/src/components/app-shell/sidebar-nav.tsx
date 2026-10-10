import { Link, useLocation } from '@tanstack/react-router'

import {
	BoxesIcon,
	ChefHatIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	GaugeIcon,
	HistoryIcon,
	MapPinIcon,
	PackageIcon,
	RulerIcon,
	ShieldCheckIcon,
	StoreIcon,
	TruckIcon,
	UtensilsCrossedIcon,
	WalletIcon,
	type LucideIcon,
} from 'lucide-react'

import { Logo } from '@/components/brand'

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

import { usePermissions } from '@/providers/auth-provider.tsx'

type NavItem = {
	title: string
	icon: LucideIcon
	href: string
	anyOf?: readonly string[]
}

type NavGroup = {
	label: string
	items: readonly NavItem[]
}

const navGroups: readonly NavGroup[] = [
	{
		label: 'Overview',
		items: [{ title: 'Dashboard', icon: GaugeIcon, href: '/' }],
	},
	{
		label: 'Inventory',
		items: [
			{ title: 'Stock', icon: PackageIcon, href: '/inventory/stock', anyOf: ['stock.read'] },
			{
				title: 'Goods Receipts',
				icon: TruckIcon,
				href: '/inventory/receiving',
				anyOf: ['receiving.read'],
			},
			{
				title: 'Stock Transfers',
				icon: ClipboardListIcon,
				href: '/inventory/transfers',
				anyOf: ['transfer.read'],
			},
			{
				title: 'Stock Count',
				icon: ClipboardCheckIcon,
				href: '/inventory/opname',
				anyOf: ['opname.read', 'opname.create'],
			},
		],
	},
	{
		label: 'Master Data',
		items: [
			{
				title: 'Materials',
				icon: BoxesIcon,
				href: '/master/materials',
				anyOf: ['material.read'],
			},
			{
				title: 'Suppliers',
				icon: TruckIcon,
				href: '/master/suppliers',
				anyOf: ['supplier.read'],
			},
			{ title: 'Units of Measure', icon: RulerIcon, href: '/master/uom', anyOf: ['uom.read'] },
			{
				title: 'Menu',
				icon: UtensilsCrossedIcon,
				href: '/master/menu',
				anyOf: ['item.read', 'category.read', 'modifier.read'],
			},
			{ title: 'Recipes', icon: ChefHatIcon, href: '/master/recipes', anyOf: ['recipe.read'] },
			{
				title: 'Payment Methods',
				icon: WalletIcon,
				href: '/master/payment-methods',
				anyOf: ['payment-method.read'],
			},
		],
	},
	{
		label: 'Administration',
		items: [
			{ title: 'Company', icon: StoreIcon, href: '/settings/company', anyOf: ['company.read'] },
			{
				title: 'Locations',
				icon: MapPinIcon,
				href: '/settings/locations',
				anyOf: ['location.read'],
			},
			{
				title: 'Access Control',
				icon: ShieldCheckIcon,
				href: '/settings/access-control',
				anyOf: ['iam.read'],
			},
			{ title: 'Audit Log', icon: HistoryIcon, href: '/settings/audit', anyOf: ['audit.read'] },
		],
	},
]

export function SidebarNav() {
	const location = useLocation()
	const { isOwner, permissions: effectivePermissions } = usePermissions()

	const visibleGroups = navGroups
		.map((group) => ({
			...group,
			items: group.items.filter(
				(item) =>
					isOwner ||
					!item.anyOf ||
					item.anyOf.some((permission) => effectivePermissions.has(permission)),
			),
		}))
		.filter((group) => group.items.length > 0)

	return (
		<Sidebar>
			{/* Ambient glow — same no-z-index technique as AppShell's ShellBackdrop (see docs/web/07-design-system.md, "Shell backdrop"); first child so it paints behind the nav items that follow. */}
			<div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -top-16 left-1/2 size-56 -translate-x-1/2 rounded-full bg-sidebar-primary/25 blur-3xl" />
				<div className="absolute -bottom-24 -left-12 size-64 rounded-full bg-accent-warm/15 blur-3xl" />
			</div>
			<SidebarHeader>
				<div className="flex h-8 items-center gap-2 px-2">
					<Logo showText={false} />
					<span className="truncate text-sm font-semibold">Ikki ERP</span>
				</div>
			</SidebarHeader>
			<SidebarContent>
				{visibleGroups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => {
									// Dashboard only matches exactly; other items also match nested detail routes.
									const isActive =
										item.href === '/'
											? location.pathname === '/'
											: location.pathname === item.href ||
												location.pathname.startsWith(`${item.href}/`)

									return (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton
												isActive={isActive}
												size="default"
												className="h-10 text-sm md:h-8 md:text-xs"
												render={<Link to={item.href} />}
											>
												<item.icon />
												<span>{item.title}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
		</Sidebar>
	)
}
