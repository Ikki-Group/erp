import type { KeyboardEvent, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface PageTab {
	id: string
	label: string
	icon?: ReactNode
	/** Badge count shown next to label. */
	count?: number
}

export interface PageTabsProps {
	tabs: PageTab[]
	activeTab: string
	onTabChange: (tabId: string) => void
	className?: string
}

/** DOM id of the tabpanel controlled by a tab; consumers render a matching `role="tabpanel"`. */
export function pageTabPanelId(tabId: string): string {
	return `tabpanel-${tabId}`
}

/**
 * Horizontal tab bar for page-level navigation between sections.
 * Used for detail pages (e.g., Material: Info | Stock | History).
 */
export function PageTabs({ tabs, activeTab, onTabChange, className }: PageTabsProps) {
	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		const last = tabs.length - 1
		let next: number | undefined
		if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
		else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
		else if (event.key === 'Home') next = 0
		else if (event.key === 'End') next = last
		if (next === undefined) return
		event.preventDefault()
		const nextId = tabs[next]!.id
		onTabChange(nextId)
		document.getElementById(`tab-${nextId}`)?.focus()
	}

	return (
		<div className={cn('border-b', className)}>
			<nav role="tablist" className="-mb-px flex gap-4 overflow-x-auto" aria-label="Bagian halaman">
				{tabs.map((tab, index) => {
					const isActive = tab.id === activeTab
					return (
						<button
							key={tab.id}
							type="button"
							role="tab"
							id={`tab-${tab.id}`}
							aria-selected={isActive}
							aria-controls={pageTabPanelId(tab.id)}
							tabIndex={isActive ? 0 : -1}
							onKeyDown={(event) => handleKeyDown(event, index)}
							onClick={() => onTabChange(tab.id)}
							className={cn(
								'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-xs font-medium transition-colors',
								isActive
									? 'border-primary text-foreground'
									: 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
							)}
						>
							{tab.icon}
							{tab.label}
							{tab.count != null && (
								<span
									className={cn(
										'ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none',
										isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
									)}
								>
									{tab.count}
								</span>
							)}
						</button>
					)
				})}
			</nav>
		</div>
	)
}
