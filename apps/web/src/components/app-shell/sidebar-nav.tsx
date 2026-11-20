import { Link, useLocation } from '@tanstack/react-router'

import {
	ArmchairIcon,
	BoxesIcon,
	ChefHatIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	ClockIcon,
	GaugeIcon,
	HistoryIcon,
	MapPinIcon,
	PackageIcon,
	ReceiptTextIcon,
	RulerIcon,
	ShoppingCartIcon,
	ShieldCheckIcon,
	StoreIcon,
	TicketIcon,
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

import { useAuth } from '@/providers/auth-provider.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

export type NavItem = {
	title: string
	icon: LucideIcon
	href: string
	anyOf?: readonly string[]
}

export type NavGroup = {
	label: string
	items: readonly NavItem[]
}

const navGroups: readonly NavGroup[] = [
	{
		label: 'Ringkasan',
		items: [{ title: 'Dasbor', icon: GaugeIcon, href: '/' }],
	},
	{
		label: 'Kasir',
		items: [
			{
				title: 'Pesanan Baru',
				icon: ShoppingCartIcon,
				href: '/pos/new-order',
				anyOf: ['order.create', 'order.read'],
			},
			{
				title: 'Riwayat Pesanan',
				icon: ReceiptTextIcon,
				href: '/pos/orders',
				anyOf: ['order.read'],
			},
			{ title: 'Shift', icon: ClockIcon, href: '/pos/shifts', anyOf: ['shift.read', 'shift.open'] },
			{ title: 'Meja', icon: ArmchairIcon, href: '/pos/tables', anyOf: ['table.manage'] },
			{ title: 'Voucher', icon: TicketIcon, href: '/pos/vouchers', anyOf: ['voucher.manage'] },
		],
	},
	{
		label: 'Inventori',
		items: [
			{ title: 'Stok', icon: PackageIcon, href: '/inventory/stock', anyOf: ['stock.read'] },
			{
				title: 'Penerimaan Barang',
				icon: TruckIcon,
				href: '/inventory/receiving',
				anyOf: ['receiving.read'],
			},
			{
				title: 'Transfer Stok',
				icon: ClipboardListIcon,
				href: '/inventory/transfers',
				anyOf: ['transfer.read'],
			},
			{
				title: 'Stok Opname',
				icon: ClipboardCheckIcon,
				href: '/inventory/opname',
				anyOf: ['opname.read', 'opname.create'],
			},
		],
	},
	{
		label: 'Data Master',
		items: [
			{ title: 'Bahan', icon: BoxesIcon, href: '/master/materials', anyOf: ['material.read'] },
			{ title: 'Pemasok', icon: TruckIcon, href: '/master/suppliers', anyOf: ['supplier.read'] },
			{ title: 'Satuan', icon: RulerIcon, href: '/master/uom', anyOf: ['uom.read'] },
			{
				title: 'Menu',
				icon: UtensilsCrossedIcon,
				href: '/master/menu',
				anyOf: ['item.read', 'category.read', 'modifier.read'],
			},
			{ title: 'Resep', icon: ChefHatIcon, href: '/master/recipes', anyOf: ['recipe.read'] },
			{
				title: 'Metode Pembayaran',
				icon: WalletIcon,
				href: '/master/payment-methods',
				anyOf: ['payment-method.read'],
			},
		],
	},
	{
		label: 'Administrasi',
		items: [
			{ title: 'Perusahaan', icon: StoreIcon, href: '/settings/company', anyOf: ['company.read'] },
			{ title: 'Lokasi', icon: MapPinIcon, href: '/settings/locations', anyOf: ['location.read'] },
			{
				title: 'Kontrol Akses',
				icon: ShieldCheckIcon,
				href: '/settings/access-control',
				anyOf: ['iam.read'],
			},
			{ title: 'Log Audit', icon: HistoryIcon, href: '/settings/audit', anyOf: ['audit.read'] },
		],
	},
]

/**
 * The sidebar's own navigation tree, filtered to what the signed-in user can
 * reach. Shared with the command palette so both stay consistent — one source
 * of truth for "where can I go".
 */
export function useVisibleNavGroups(): readonly NavGroup[] {
	const { access, globalPermissions, isOwner, permissions } = useAuth()
	const { activeLocation } = useLocationContext()

	const effectivePermissions = new Set([
		...globalPermissions,
		...permissions,
		...(activeLocation ? (access[String(activeLocation.id)] ?? []) : []),
	])

	return navGroups
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
}

export function SidebarNav() {
	const location = useLocation()
	const visibleGroups = useVisibleNavGroups()

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
