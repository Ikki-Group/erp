import type { ReactNode } from 'react'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { AppHeader } from './header'
import { SidebarNav } from './sidebar-nav'

interface AppShellProps {
	children: ReactNode
}

/**
 * Ambient corner glow behind the app's working surface — two blurred, low
 * -opacity washes (brand green + warm clay), the same technique as the login
 * hero's orbs but turned down from a feature splash to a background
 * texture: visible through the gutters between cards and in the page's
 * empty margins, fully hidden once a card (or the header bar) sits on top.
 * Lives on `SidebarInset` — the panel both the header and the scrolling
 * `<main>` share — so it reads as one fixed backdrop rather than scrolling
 * away with the content. The top glow starts below the header's own
 * opaque band (`top-10`, past `h-14`) so it isn't entirely hidden behind it.
 *
 * No `z-index` here on purpose — `SidebarInset`'s own ancestors already
 * carry one (the fixed sidebar panel is `z-10`), so a negative `z-index`
 * would resolve against *that* stacking context instead of this panel and
 * paint behind `SidebarInset`'s own background, i.e. disappear entirely.
 * Being the first child is what keeps it behind the header/main that follow.
 * See docs/web/07-design-system.md, "Shell backdrop".
 */
function ShellBackdrop() {
	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
			<div className="absolute top-10 -right-20 size-80 rounded-full bg-primary/10 blur-3xl" />
			<div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-accent-warm/10 blur-3xl" />
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
