import type { LucideIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface EmptyStateProps {
	icon?: LucideIcon
	title?: string
	description?: string
	action?: ReactNode
	className?: string
	/** Compact mode for inline/card usage */
	compact?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
	icon: Icon,
	title = 'Belum ada data',
	description,
	action,
	className,
	compact = false,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center text-center',
				compact ? 'gap-2 py-6' : 'gap-3 py-12',
				className,
			)}
		>
			{Icon && (
				<div
					className={cn(
						'flex items-center justify-center rounded-lg bg-muted',
						compact ? 'size-10' : 'size-12',
					)}
				>
					<Icon className={cn('text-muted-foreground', compact ? 'size-5' : 'size-6')} />
				</div>
			)}
			<div className="space-y-1">
				<p className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-base')}>
					{title}
				</p>
				{description && (
					<p
						className={cn(
							'text-muted-foreground max-w-sm mx-auto',
							compact ? 'text-xs' : 'text-sm',
						)}
					>
						{description}
					</p>
				)}
			</div>
			{action && <div className="mt-1">{action}</div>}
		</div>
	)
}
