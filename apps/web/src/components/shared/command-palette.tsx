import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { SearchIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { Kbd, KbdGroup } from '@/components/ui/kbd'

export interface CommandAction {
	id: string
	label: string
	description?: string
	icon?: ReactNode
	/** Rendered as a `Kbd` sequence, e.g. `['\u2318', 'K']`. */
	shortcut?: string[]
	/** Groups actions under a muted label in the list, e.g. "Navigate", "Create". */
	group?: string
	/** Extra terms that match this action without appearing in its label. */
	keywords?: string[]
	onSelect: () => void
}

interface CommandPaletteProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	actions: readonly CommandAction[]
	placeholder?: string
	emptyMessage?: string
}

function matches(action: CommandAction, query: string): boolean {
	if (!query) return true
	const haystack = [action.label, action.description, action.group, ...(action.keywords ?? [])]
		.filter(Boolean)
		.join(' ')
		.toLowerCase()
	return haystack.includes(query.toLowerCase())
}

/**
 * Global quick-action search \u2014 Cmd/Ctrl+K opens it (via
 * `useCommandPaletteShortcut`), type to filter, arrow keys + Enter to run an
 * action. Presentation and keyboard interaction only: the app shell owns the
 * actual action list (page navigation, "New order", etc.) and passes it in.
 *
 * Not built on `Combobox` (`components/ui/combobox.tsx`) \u2014 that component
 * anchors its popup to an input it's attached to, which doesn't fit a
 * standalone modal palette. This hand-rolls the filter + roving-index
 * keyboard nav instead, following the same `data-highlighted` visual
 * language as `ComboboxItem` for consistency.
 */
export function CommandPalette({
	open,
	onOpenChange,
	actions,
	placeholder = 'Type a command or search\u2026',
	emptyMessage = 'No matching actions.',
}: CommandPaletteProps) {
	const [query, setQuery] = useState('')
	const [activeIndex, setActiveIndex] = useState(0)
	const listRef = useRef<HTMLDivElement>(null)

	const filtered = useMemo(() => actions.filter((a) => matches(a, query)), [actions, query])

	const groups = useMemo(() => {
		const order: string[] = []
		const byGroup = new Map<string, CommandAction[]>()
		for (const action of filtered) {
			const key = action.group ?? ''
			if (!byGroup.has(key)) {
				byGroup.set(key, [])
				order.push(key)
			}
			byGroup.get(key)?.push(action)
		}
		return order.map((key) => ({ group: key, actions: byGroup.get(key) ?? [] }))
	}, [filtered])

	useEffect(() => {
		setActiveIndex(0)
	}, [filtered.length, query])

	useEffect(() => {
		if (!open) {
			setQuery('')
			setActiveIndex(0)
		}
	}, [open])

	useEffect(() => {
		listRef.current
			?.querySelector(`[data-index="${activeIndex}"]`)
			?.scrollIntoView({ block: 'nearest' })
	}, [activeIndex])

	const runAction = (action: CommandAction) => {
		onOpenChange(false)
		action.onSelect()
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPortal>
				<DialogOverlay />
				<DialogPrimitive.Popup
					data-slot="command-palette"
					className="fixed top-[16%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
				>
					<div className="flex items-center gap-2 border-b px-3">
						<SearchIcon className="size-4 shrink-0 text-muted-foreground" />
						<input
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={placeholder}
							role="combobox"
							aria-expanded="true"
							aria-controls="command-palette-list"
							aria-activedescendant={
								filtered[activeIndex]
									? `command-palette-item-${filtered[activeIndex].id}`
									: undefined
							}
							onKeyDown={(e) => {
								if (e.key === 'ArrowDown') {
									e.preventDefault()
									setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length))
								} else if (e.key === 'ArrowUp') {
									e.preventDefault()
									setActiveIndex((i) =>
										filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length,
									)
								} else if (e.key === 'Enter') {
									e.preventDefault()
									const action = filtered[activeIndex]
									if (action) runAction(action)
								}
							}}
							className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						/>
						<KbdGroup>
							<Kbd>Esc</Kbd>
						</KbdGroup>
					</div>

					<div
						id="command-palette-list"
						role="listbox"
						ref={listRef}
						className="max-h-80 overflow-y-auto p-1"
					>
						{filtered.length === 0 ? (
							<p className="px-3 py-6 text-center text-xs text-muted-foreground">{emptyMessage}</p>
						) : (
							groups.map(({ group, actions: groupActions }) => (
								<div key={group || '_'} role="group" aria-label={group || undefined}>
									{group && <p className="px-2 py-1.5 text-xs text-muted-foreground">{group}</p>}
									{groupActions.map((action) => {
										const index = filtered.indexOf(action)
										const isActive = index === activeIndex
										return (
											<button
												key={action.id}
												id={`command-palette-item-${action.id}`}
												data-index={index}
												type="button"
												role="option"
												aria-selected={isActive}
												onMouseEnter={() => setActiveIndex(index)}
												onClick={() => runAction(action)}
												className={cn(
													'flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs/relaxed outline-hidden select-none',
													isActive && 'bg-accent text-accent-foreground',
												)}
											>
												{action.icon && (
													<span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-3.5">
														{action.icon}
													</span>
												)}
												<span className="min-w-0 flex-1 truncate">
													<span className="font-medium">{action.label}</span>
													{action.description && (
														<span className="ml-1.5 text-muted-foreground">
															{action.description}
														</span>
													)}
												</span>
												{action.shortcut && (
													<KbdGroup>
														{action.shortcut.map((key, i) => (
															<Kbd key={i}>{key}</Kbd>
														))}
													</KbdGroup>
												)}
											</button>
										)
									})}
								</div>
							))
						)}
					</div>
				</DialogPrimitive.Popup>
			</DialogPortal>
		</Dialog>
	)
}

/**
 * Opens the command palette on Cmd+K (macOS) / Ctrl+K (Windows/Linux) from
 * anywhere in the app. Mount once near the app shell:
 *
 * ```tsx
 * const [open, setOpen] = useState(false)
 * useCommandPaletteShortcut(() => setOpen(true))
 * <CommandPalette open={open} onOpenChange={setOpen} actions={actions} />
 * ```
 */
export function useCommandPaletteShortcut(onOpen: () => void): void {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				onOpen()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [onOpen])
}
