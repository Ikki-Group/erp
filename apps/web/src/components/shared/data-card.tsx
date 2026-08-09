import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DataCardProps {
	title: string
	description?: string
	actions?: ReactNode
	children: ReactNode
	className?: string
	noPadding?: boolean
}

export function DataCard({
	title,
	description,
	actions,
	children,
	className,
	noPadding,
}: DataCardProps) {
	return (
		<div className={cn('rounded-lg border bg-card text-card-foreground', className)}>
			<div className="flex items-start justify-between gap-4 border-b px-4 py-3">
				<div className="space-y-0.5">
					<h3 className="text-sm font-semibold">{title}</h3>
					{description && <p className="text-xs text-muted-foreground">{description}</p>}
				</div>
				{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
			</div>
			<div className={cn(!noPadding && 'p-4')}>{children}</div>
		</div>
	)
}
