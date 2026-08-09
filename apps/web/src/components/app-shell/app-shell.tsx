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
			<SidebarInset>
				<AppHeader />
				<div className="flex-1 overflow-auto p-6">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
