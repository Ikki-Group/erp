import type { ReactNode } from 'react'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { AppHeader } from './header'
import { SidebarNav } from './sidebar-nav'

interface AppShellProps {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return (
		<SidebarProvider className="h-svh min-h-0 overflow-hidden">
			<SidebarNav />
			<SidebarInset className="min-h-0 overflow-hidden contain-inline-size">
				<AppHeader />
				<main className="min-h-0 flex-1 overflow-y-auto p-4 contain-inline-size sm:p-6">
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
