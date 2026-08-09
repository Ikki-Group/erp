import type { ReactNode } from 'react'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { AppHeader } from './header'
import { SidebarNav } from './sidebar-nav'

interface AppShellProps {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return (
		<SidebarProvider>
			<SidebarNav />
			<SidebarInset className="contain-inline-size">
				<AppHeader />
				<main className="flex-1 overflow-y-auto p-6 contain-inline-size">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
