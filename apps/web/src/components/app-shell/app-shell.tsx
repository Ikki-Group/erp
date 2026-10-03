import type { ReactNode } from 'react'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { AppHeader } from './header'
import { SidebarNav } from './sidebar-nav'

interface AppShellProps {
	children: ReactNode
}

/**
 * Ambient corner glow behind the app's working surface — two blurred, very
 * low-opacity washes (brand green + warm clay), the same technique as the
 * login hero's orbs but turned down from a feature splash to a background
 * texture: still visible through the gutters between cards on an empty page,
 * fully hidden once content (opaque white cards, the header bar) sits on top.
 * Lives on `SidebarInset` — the panel both the header and the scrolling
 * `<main>` share — so it reads as one fixed backdrop rather than scrolling
 * away with the content.
 */
function ShellBackdrop() {
	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
			<div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/5 blur-3xl" />
			<div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-accent-warm/5 blur-3xl" />
		</div>
	)
}

export function AppShell({ children }: AppShellProps) {
	return (
		<SidebarProvider className="h-svh min-h-0 overflow-hidden">
			<SidebarNav />
			<SidebarInset className="min-h-0 overflow-hidden contain-inline-size">
				<ShellBackdrop />
				<AppHeader />
				<main className="min-h-0 flex-1 overflow-y-auto p-4 contain-inline-size sm:p-6">
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
