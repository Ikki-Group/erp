import { Link, useLocation } from '@tanstack/react-router'

import {
	BoxesIcon,
	ChefHatIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	ClockIcon,
	GaugeIcon,
	HistoryIcon,
	LayersIcon,
	MapPinIcon,
	PackageIcon,
	PlusCircleIcon,
	RulerIcon,
	ShieldCheckIcon,
	ShoppingCartIcon,
	StoreIcon,
	TagIcon,
	TruckIcon,
	UsersIcon,
	UtensilsCrossedIcon,
	WalletIcon,
	type LucideIcon,
} from 'lucide-react'

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

import { useAuth } from '@/providers/auth-provider.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

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
		label: 'Point of Sale',
		items: [
			{
				title: 'New Order',
				icon: PlusCircleIcon,
				href: '/pos/new-order',
				anyOf: ['order.create'],
			},
			{ title: 'Orders', icon: ShoppingCartIcon, href: '/pos/orders', anyOf: ['order.read'] },
			{
				title: 'Shifts',
				icon: ClockIcon,
				href: '/pos/shifts',
				anyOf: ['shift.read', 'shift.open'],
			},
			{ title: 'Tables', icon: LayersIcon, href: '/pos/tables', anyOf: ['table.manage'] },
			{ title: 'Vouchers', icon: TagIcon, href: '/pos/vouchers', anyOf: ['voucher.manage'] },
		],
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
				title: 'Location Staff',
				icon: UsersIcon,
				href: '/settings/location-staff',
				anyOf: ['location-staff.read'],
			},
			{ title: 'Locations', icon: MapPinIcon, href: '/master/locations', anyOf: ['location.read'] },
			{ title: 'Users', icon: UsersIcon, href: '/settings/users', anyOf: ['iam.read'] },
			{ title: 'Roles', icon: ShieldCheckIcon, href: '/settings/roles', anyOf: ['iam.read'] },
			{ title: 'Audit Log', icon: HistoryIcon, href: '/settings/audit', anyOf: ['audit.read'] },
		],
	},
]

export function SidebarNav() {
	const location = useLocation()
	const { access, globalPermissions, isOwner, permissions } = useAuth()
	const { activeLocation } = useLocationContext()

	const effectivePermissions = new Set([
		...globalPermissions,
		...permissions,
		...(activeLocation ? (access[String(activeLocation.id)] ?? []) : []),
	])

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
			<SidebarHeader>
				<div className="flex h-8 items-center gap-2 px-2">
					<div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
						<StoreIcon className="size-3.5" />
					</div>
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
