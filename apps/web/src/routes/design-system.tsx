import { useState } from 'react'

import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'

import {
	BoxesIcon,
	CompassIcon,
	LayoutGridIcon,
	LayoutTemplateIcon,
	MenuIcon,
	MessageSquareWarningIcon,
	MousePointerClickIcon,
	PaletteIcon,
	SlidersHorizontalIcon,
	SquareStackIcon,
	TableIcon,
	type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { ThemeToggle } from '@/components/shared/theme-toggle'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

export const Route = createFileRoute('/design-system')({
	component: DesignSystemLayout,
})

interface NavItem {
	title: string
	href: string
	icon: LucideIcon
}

interface NavGroup {
	label: string
	items: readonly NavItem[]
}

/**
 * The design-system catalog's own nav. Add a new page by adding a route file
 * under `routes/design-system/` and an entry here — the shell (this file)
 * never needs to change beyond that.
 */
const NAV_GROUPS: readonly NavGroup[] = [
	{
		label: 'Foundations',
		items: [{ title: 'Overview', href: '/design-system', icon: LayoutGridIcon }],
	},
	{
		label: 'Components',
		items: [
			{ title: 'Buttons & Actions', href: '/design-system/buttons', icon: MousePointerClickIcon },
			{ title: 'Forms & Inputs', href: '/design-system/forms', icon: SlidersHorizontalIcon },
			{ title: 'Cards', href: '/design-system/cards', icon: BoxesIcon },
			{ title: 'Data Display', href: '/design-system/data-display', icon: BoxesIcon },
			{ title: 'Tables', href: '/design-system/tables', icon: TableIcon },
			{ title: 'Feedback', href: '/design-system/feedback', icon: MessageSquareWarningIcon },
			{ title: 'Overlays', href: '/design-system/overlays', icon: SquareStackIcon },
			{ title: 'Navigation', href: '/design-system/navigation', icon: CompassIcon },
			{ title: 'Page Scaffolds', href: '/design-system/scaffolds', icon: LayoutTemplateIcon },
		],
	},
]

/** Shell for the internal design-system catalog: a category nav + the active page's content. */
function DesignSystemLayout() {
	const location = useLocation()
	const [mobileNavOpen, setMobileNavOpen] = useState(false)

	const navContent = (
		<>
			{NAV_GROUPS.map((group) => (
				<div key={group.label} className="space-y-1">
					<p className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						{group.label}
					</p>
					{group.items.map((item) => {
						const isActive = location.pathname === item.href
						return (
							<Link
								key={item.href}
								to={item.href}
								onClick={() => setMobileNavOpen(false)}
								className={cn(
									'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
									isActive
										? 'bg-accent font-medium text-accent-foreground'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground',
								)}
							>
								<item.icon className="size-4" />
								{item.title}
							</Link>
						)
					})}
				</div>
			))}

			<div className="mt-auto px-2 text-xs text-muted-foreground">
				Catalog of what the app uses. DESIGN.md is the authority.
			</div>
		</>
	)

	return (
		<div className="flex min-h-svh bg-background text-foreground">
			<nav className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r px-4 py-6 md:flex">
				<div className="flex items-center justify-between px-2">
					<div className="flex items-center gap-2">
						<div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<PaletteIcon className="size-3.5" />
						</div>
						<span className="font-heading text-sm font-semibold tracking-tight">Design System</span>
					</div>
					<ThemeToggle />
				</div>

				{navContent}
			</nav>

			<div className="flex min-w-0 flex-1 flex-col">
				<div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background px-4 py-3 md:hidden">
					<div className="flex items-center gap-2">
						<div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<PaletteIcon className="size-3.5" />
						</div>
						<span className="font-heading text-sm font-semibold tracking-tight">Design System</span>
					</div>
					<div className="flex items-center gap-1">
						<ThemeToggle />
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Open catalog navigation"
							onClick={() => setMobileNavOpen(true)}
						>
							<MenuIcon />
						</Button>
					</div>
				</div>

				<div className="min-w-0 flex-1 overflow-y-auto">
					<div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
						<Outlet />
					</div>
				</div>
			</div>

			<Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
				<SheetContent side="left" className="flex w-72 flex-col gap-6 px-4 py-6">
					<SheetTitle className="sr-only">Catalog navigation</SheetTitle>
					{navContent}
				</SheetContent>
			</Sheet>
		</div>
	)
}
