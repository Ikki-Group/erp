import { useCallback } from 'react'

import { useNavigate } from '@tanstack/react-router'

import { CommandPalette, useCommandPaletteShortcut } from '@/components/shared'
import type { CommandAction } from '@/components/shared'

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
