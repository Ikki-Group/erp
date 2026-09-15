import type { ReactNode } from 'react'

import { InboxIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { IconTile } from '@/components/reui/icon-tile'

interface EmptyStateProps {
	title: string
	description?: string
	icon?: ReactNode
	action?: ReactNode
	className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
	return (
		<div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
			<IconTile variant="soft" size="lg" className="mb-3">
				{icon ?? <InboxIcon />}
			</IconTile>
			<p className="text-sm font-medium">{title}</p>
			{description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
			{action && <div className="mt-4">{action}</div>}
		</div>
	)
}
