import {
	BoxesIcon,
	ChefHatIcon,
	ClipboardListIcon,
	GaugeIcon,
	LayersIcon,
	MapPinIcon,
	PackageIcon,
	SettingsIcon,
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
	SidebarRail,
} from '@/components/ui/sidebar'

const navGroups = [
	{
		label: 'Overview',
		items: [{ title: 'Dashboard', icon: GaugeIcon, href: '/' }],
	},
	{
		label: 'Master',
		items: [
			{ title: 'Locations', icon: MapPinIcon, href: '#' },
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
			{ title: 'Users', icon: UsersIcon, href: '#' },
			{ title: 'General', icon: SettingsIcon, href: '#' },
		],
	},
]

export function SidebarNav() {
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="flex h-8 items-center gap-2 px-2">
					<div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
						<StoreIcon className="size-3.5" />
					</div>
					<span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
						Ikki ERP
					</span>
				</div>
			</SidebarHeader>
			<SidebarContent>
				{navGroups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton tooltip={item.title}>
											<item.icon />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter />
			<SidebarRail />
		</Sidebar>
	)
}
