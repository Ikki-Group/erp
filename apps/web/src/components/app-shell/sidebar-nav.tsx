import { Link, useLocation } from '@tanstack/react-router'

import {
	BoxesIcon,
	ChefHatIcon,
	ClipboardListIcon,
	ClockIcon,
	GaugeIcon,
	LayersIcon,
	MapPinIcon,
	PackageIcon,
	RulerIcon,
	SettingsIcon,
	ShieldCheckIcon,
	ShoppingCartIcon,
	StoreIcon,
	TagIcon,
	TruckIcon,
	UsersIcon,
	UtensilsCrossedIcon,
	WalletIcon,
} from 'lucide-react'

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

const navGroups = [
	{
		label: 'Overview',
		items: [{ title: 'Dashboard', icon: GaugeIcon, href: '/' }],
	},
	{
		label: 'Master',
		items: [
			{ title: 'Locations', icon: MapPinIcon, href: '/master/locations' },
			{ title: 'UoM', icon: RulerIcon, href: '/master/uom' },
			{ title: 'Materials', icon: BoxesIcon, href: '/master/materials' },
			{ title: 'Suppliers', icon: TruckIcon, href: '/master/suppliers' },
			{ title: 'Menu', icon: UtensilsCrossedIcon, href: '/master/menu' },
			{ title: 'Recipes', icon: ChefHatIcon, href: '/master/recipes' },
			{ title: 'Payment Methods', icon: WalletIcon, href: '/master/payment-methods' },
		],
	},
	{
		label: 'POS',
		items: [
			{ title: 'Orders', icon: ShoppingCartIcon, href: '#' },
			{ title: 'Vouchers', icon: TagIcon, href: '/pos/vouchers' },
			{ title: 'Tables', icon: LayersIcon, href: '/pos/tables' },
			{ title: 'Shifts', icon: ClockIcon, href: '/pos/shifts' },
		],
	},
	{
		label: 'Inventory',
		items: [
			{ title: 'Stock', icon: PackageIcon, href: '/inventory/stock' },
			{ title: 'Transfers', icon: ClipboardListIcon, href: '/inventory/transfers' },
		],
	},
	{
		label: 'Settings',
		items: [
			{ title: 'Company', icon: StoreIcon, href: '#' },
			{ title: 'Users', icon: UsersIcon, href: '/settings/users' },
			{ title: 'Roles', icon: ShieldCheckIcon, href: '/settings/roles' },
			{ title: 'General', icon: SettingsIcon, href: '#' },
		],
	},
]

export function SidebarNav() {
	const location = useLocation()

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
				{navGroups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => {
									const isActive = item.href !== '#' && location.pathname === item.href
									const isDisabled = item.href === '#'

									return (
										<SidebarMenuItem key={item.title}>
											{isDisabled ? (
												<SidebarMenuButton disabled>
													<item.icon />
													<span>{item.title}</span>
												</SidebarMenuButton>
											) : (
												<SidebarMenuButton isActive={isActive} render={<Link to={item.href} />}>
													<item.icon />
													<span>{item.title}</span>
												</SidebarMenuButton>
											)}
										</SidebarMenuItem>
									)
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	)
}
