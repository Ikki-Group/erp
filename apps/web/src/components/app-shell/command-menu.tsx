import { useCallback } from 'react'

import { useNavigate } from '@tanstack/react-router'

import { SearchIcon } from 'lucide-react'

import { CommandPalette, useCommandPaletteShortcut } from '@/components/shared'
import type { CommandAction } from '@/components/shared'

import { Kbd, KbdGroup } from '@/components/ui/kbd'

import { useVisibleNavGroups } from './sidebar-nav'

interface CommandMenuProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

/**
 * Global `⌘K` / `Ctrl+K` navigation palette. Actions are seeded from the same
 * permission-filtered tree the sidebar renders, so the two can never drift.
 */
export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
	useCommandPaletteShortcut(useCallback(() => onOpenChange(true), [onOpenChange]))
	const navigate = useNavigate()
	const groups = useVisibleNavGroups()

	const actions: CommandAction[] = groups.flatMap((group) =>
		group.items.map((item) => ({
			id: `nav:${item.href}`,
			label: item.title,
			group: group.label,
			icon: <item.icon />,
			keywords: [item.href],
			onSelect: () => navigate({ to: item.href }),
		})),
	)

	return (
		<CommandPalette
			open={open}
			onOpenChange={onOpenChange}
			actions={actions}
			placeholder="Cari halaman…"
		/>
	)
}

/** Header affordance that opens the palette — the only entry point on touch devices. */
export function CommandTrigger({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			aria-label="Cari halaman"
			aria-keyshortcuts="Meta+K Control+K"
			onClick={onClick}
			className="inline-flex min-h-9 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm text-muted-foreground hover:bg-accent"
		>
			<SearchIcon className="size-4" />
			<span className="hidden sm:inline">Cari</span>
			<KbdGroup className="hidden sm:flex">
				<Kbd>⌘</Kbd>
				<Kbd>K</Kbd>
			</KbdGroup>
		</button>
	)
}
