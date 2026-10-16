import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { IconTile } from '@/components/reui/icon-tile'

import { TONE_CLASS, type StatCardTone } from './stat-card'

interface DataCardProps {
	title: string
	description?: string
	/** Small identifying glyph shown left of the title, tinted via `tone` — the same pairing `StatCard` uses, so a dashboard's cards and stat tiles read as one family. Omit for a plain titled card. */
	icon?: ReactNode
	tone?: StatCardTone
	actions?: ReactNode
	children: ReactNode
	className?: string
	noPadding?: boolean
}

export function DataCard({
	title,
	description,
	icon,
	tone = 'default',
	actions,
	children,
	className,
	noPadding,
}: DataCardProps) {
	return (
		<div
			data-slot="data-card"
			className={cn('min-w-0 rounded-lg border bg-card text-card-foreground', className)}
		>
			<div className="flex flex-wrap items-start justify-between gap-4 border-b px-4 py-3.5">
				<div className="flex min-w-0 items-start gap-3">
					{icon && (
						<IconTile variant="soft" size="sm" className={TONE_CLASS[tone]}>
							{icon}
						</IconTile>
					)}
					<div className="min-w-0 space-y-0.5">
						<h3 className="font-heading text-sm font-semibold tracking-tight">{title}</h3>
						{description && <p className="text-xs text-muted-foreground">{description}</p>}
					</div>
				</div>
				{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
			</div>
			<div className={cn('min-w-0', !noPadding && 'p-4')}>{children}</div>
		</div>
	)
}
