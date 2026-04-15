import { Suspense, useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useLocation } from '@tanstack/react-router'

import { ChevronRightIcon } from 'lucide-react'

import { getAppMenu } from '@/config/app-menu'
import { useAppState } from '@/hooks/use-app-state'

import { IkkiLogo } from '@/components/blocks/brand/logo'
import { LoadingPage } from '@/components/blocks/feedback/loading-page'
import { ThemeSwitcher } from '@/components/providers/theme'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'

import { UserSection } from '@/features/iam/components/user-section'
import { stockAlertApi } from '@/features/inventory/api/inventory.api'
import { InventoryAlertBanner } from '@/features/inventory/components/inventory-alert-banner'
import { LocationSwitcher } from '@/features/location/components/location-switcher'

import { Separator } from '../ui/separator'
import { SidebarMenuBadge } from '../ui/sidebar'
import { Breadcrumbs } from './breadcrumbs'

export function AppLayout() {
	const { setSidebarOpen, sidebarOpen } = useAppState()

	return (
		<SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
			<Sidebar>
				<SidebarHeader className="border-b h-16">
					<SidebarBrand />
				</SidebarHeader>
				<SidebarContent>
					<SidebarMenus />
				</SidebarContent>
				<SidebarFooter>
					<UserSection />
				</SidebarFooter>
			</Sidebar>
			<SidebarInset className="bg-background-secondary/40">
				<Header />
				<InventoryAlertBanner />
				<main
					className="flex flex-1 flex-col @container animate-enter"
					style={{ animationDelay: '80ms' }}
				>
					<Suspense fallback={<LoadingPage />}>
						<Outlet />
					</Suspense>
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}

function SidebarBrand() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size="lg" render={<Link to="/" />}>
					<IkkiLogo />
					<div className="grid flex-1 text-left text-sm leading-tight gap-0.5">
						<span className="truncate font-bold tracking-tight text-foreground/90">
							Ikki Management
						</span>
						<span className="truncate text-micro uppercase font-bold text-muted-foreground/50">
							Backoffice
						</span>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}

function SidebarMenus() {
	const { pathname } = useLocation()

	const { data: alertCountData } = useQuery(stockAlertApi.count.query({}))
	const alertCount = alertCountData?.data.count ?? 0

	const groups = useMemo(
		() => getAppMenu(pathname, { inventoryAlerts: alertCount }),
		[pathname, alertCount],
	)

	return (
		<div className="py-2 flex flex-col gap-1">
			{groups.map((group) => (
				<SidebarGroup key={group.label}>
					<SidebarGroupLabel className="px-3 text-badge uppercase text-muted-foreground/60">
						{group.label}
					</SidebarGroupLabel>
					<SidebarMenu className="gap-1.5 px-1">
						{group.items.map((menu) => {
							if (menu.children?.length) {
								return (
									<Collapsible
										key={menu.href}
										className="group/collapsible"
										defaultOpen={menu.isActive ?? menu.children.some((x) => x.isActive)}
										title={menu.title}
									>
										<SidebarMenuButton render={<CollapsibleTrigger />}>
											{menu.icon && <menu.icon className="size-4" />}
											<span className="font-medium">{menu.title}</span>
											<ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
										</SidebarMenuButton>
										<CollapsibleContent>
											<SidebarMenuSub className="mt-1">
												{menu.children.map((subItem) => (
													<SidebarMenuSubItem key={subItem.href}>
														<SidebarMenuSubButton
															isActive={!!subItem.isActive}
															render={<Link to={subItem.href} />}
														>
															{subItem.title}
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										</CollapsibleContent>
									</Collapsible>
								)
							}

							return (
								<SidebarMenuItem key={menu.href}>
									<SidebarMenuButton
										isActive={!!menu.isActive}
										render={<Link to={menu.href} />}
										tooltip={menu.title}
									>
										{menu.icon && <menu.icon className="size-4" />}
										{menu.title}
									</SidebarMenuButton>
									{menu.badge !== undefined && (
										<SidebarMenuBadge className="bg-warning text-warning-foreground font-bold">
											{menu.badge}
										</SidebarMenuBadge>
									)}
								</SidebarMenuItem>
							)
						})}
					</SidebarMenu>
				</SidebarGroup>
			))}
		</div>
	)
}

function Header() {
	return (
		<header className="flex h-16 shrink-0 items-center gap-4 border-b border-border/60 px-4 transition-all duration-300 top-0 sticky bg-background/80 backdrop-blur-xl z-20 animate-fade-in">
			<div className="flex items-center gap-3">
				<SidebarTrigger variant="ghost" size="icon-lg" />
				<Separator orientation="vertical" />
				<Breadcrumbs />
			</div>
			<div className="ml-auto flex items-center gap-4">
				<LocationSwitcher />
				<Separator orientation="vertical" />
				<ThemeSwitcher />
			</div>
		</header>
	)
}
