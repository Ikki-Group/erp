import { Link, useLocation } from '@tanstack/react-router'

import {
	BoxesIcon,
	ChefHatIcon,
	ClipboardListIcon,
	GaugeIcon,
	LayersIcon,
	MapPinIcon,
	PackageIcon,
	RulerIcon,
	SettingsIcon,
	ShieldCheckIcon,
	ShoppingCartIcon,
	StoreIcon,
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
			{ title: 'Materials', icon: BoxesIcon, href: '#' },
			{ title: 'Suppliers', icon: TruckIcon, href: '#' },
			{ title: 'Menu', icon: UtensilsCrossedIcon, href: '#' },
			{ title: 'Recipes', icon: ChefHatIcon, href: '#' },
			{ title: 'Payment Methods', icon: WalletIcon, href: '#' },
		],
	},
	{
		label: 'POS',
		items: [
			{ title: 'Orders', icon: ShoppingCartIcon, href: '#' },
			{ title: 'Tables', icon: LayersIcon, href: '#' },
		],
	},
	{
		label: 'Inventory',
		items: [
			{ title: 'Stock', icon: PackageIcon, href: '#' },
			{ title: 'Transfers', icon: ClipboardListIcon, href: '#' },
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
