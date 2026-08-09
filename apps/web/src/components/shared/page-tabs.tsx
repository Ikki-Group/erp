import type { ReactNode } from 'react'

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

/**
 * Horizontal tab bar for page-level navigation between sections.
 * Used for detail pages (e.g., Material: Info | Stock | History).
 */
export function PageTabs({ tabs, activeTab, onTabChange, className }: PageTabsProps) {
	return (
		<div className={cn('border-b', className)}>
			<nav className="-mb-px flex gap-4 overflow-x-auto" aria-label="Tabs">
				{tabs.map((tab) => {
					const isActive = tab.id === activeTab
					return (
						<button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={isActive}
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
										'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
										isActive
											? 'bg-primary/10 text-primary'
											: 'bg-muted text-muted-foreground',
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
