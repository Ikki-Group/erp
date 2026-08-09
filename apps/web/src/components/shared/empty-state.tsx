import type { ReactNode } from 'react'

import { InboxIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

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
			<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
				{icon ?? <InboxIcon className="size-5" />}
			</div>
			<p className="text-sm font-medium">{title}</p>
			{description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
			{action && <div className="mt-4">{action}</div>}
		</div>
	)
}
