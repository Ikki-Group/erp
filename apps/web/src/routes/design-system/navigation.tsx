import { useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { BoxesIcon, LayoutDashboardIcon, SettingsIcon, StoreIcon, TruckIcon } from 'lucide-react'

import { PageHeader, PageSection, PageTabs } from '@/components/shared'

import { Separator } from '@/components/ui/separator'
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
	SidebarProvider,
} from '@/components/ui/sidebar'

export const Route = createFileRoute('/design-system/navigation')({
	component: NavigationPage,
})

function NavigationPage() {
	return (
		<div className="space-y-10">
			<PageHeader
				title="Navigation"
				description="Wayfinding components — the app shell's sidebar, and tabs within a page."
			/>

			{/* ─── PAGE TABS ─── */}
			<PageSection title="Page Tabs" description="Horizontal tab navigation for detail pages.">
				<PageTabsDemo />
			</PageSection>

			<Separator />

			{/* ─── SIDEBAR ─── */}
			<PageSection
				title="Sidebar"
				description="The app shell's primary nav — charcoal-green surface, forest-green active state. Shown here as the real component without its viewport-pinned/mobile behavior, for a bounded preview — see that responsive pattern live in this catalog's own nav by resizing the window."
			>
				<SidebarNavDemo />
			</PageSection>
		</div>
	)
}

const SIDEBAR_DEMO_ITEMS = [
	{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
	{ id: 'stock', label: 'Stock', icon: BoxesIcon },
	{ id: 'transfers', label: 'Transfers', icon: TruckIcon },
	{ id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const

function SidebarNavDemo() {
	const [active, setActive] = useState<string>('stock')

	return (
		<div className="h-80 w-64 overflow-hidden rounded-lg border">
			<SidebarProvider className="h-full min-h-0" defaultOpen>
				<Sidebar collapsible="none" className="h-full">
					<SidebarHeader>
						<div className="flex h-8 items-center gap-2 px-2">
							<div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
								<StoreIcon className="size-3.5" />
							</div>
							<span className="truncate text-sm font-semibold">Ikki ERP</span>
						</div>
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Operations</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{SIDEBAR_DEMO_ITEMS.map((item) => (
										<SidebarMenuItem key={item.id}>
											<SidebarMenuButton
												isActive={active === item.id}
												onClick={() => setActive(item.id)}
											>
												<item.icon />
												<span>{item.label}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter>
						<div className="flex items-center gap-2 rounded-md px-2 py-1.5">
							<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
								BS
							</div>
							<div className="min-w-0">
								<p className="truncate text-xs font-medium text-sidebar-foreground">Budi Santoso</p>
								<p className="truncate text-xs text-sidebar-foreground/60">Warehouse Staff</p>
							</div>
						</div>
					</SidebarFooter>
				</Sidebar>
			</SidebarProvider>
		</div>
	)
}

function PageTabsDemo() {
	const [activeTab, setActiveTab] = useState('info')

	return (
		<div className="space-y-4">
			<PageTabs
				tabs={[
					{ id: 'info', label: 'Info' },
					{ id: 'stock', label: 'Stock', count: 3 },
					{ id: 'history', label: 'History', count: 24 },
					{ id: 'pricing', label: 'Pricing' },
				]}
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
			<p className="text-sm text-muted-foreground">
				Active tab: <span className="font-medium text-foreground">{activeTab}</span>
			</p>
		</div>
	)
}
