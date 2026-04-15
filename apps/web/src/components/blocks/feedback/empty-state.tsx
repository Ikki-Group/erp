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
				'flex flex-col items-center justify-center text-center animate-fade-in',
				compact ? 'gap-2.5 py-8' : 'gap-4 py-16',
				className,
			)}
		>
			{Icon && (
				<div
					className={cn(
						'flex items-center justify-center rounded-xl bg-muted/60 border border-border/60',
						compact ? 'size-11' : 'size-14',
					)}
				>
					<Icon className={cn('text-muted-foreground/60', compact ? 'size-5' : 'size-6')} />
				</div>
			)}
			<div className="space-y-1.5">
				<p
					className={cn(
						'font-semibold tracking-tight text-foreground/90',
						compact ? 'text-sm' : 'text-base',
					)}
				>
					{title}
				</p>
				{description && (
					<p
						className={cn(
							'text-muted-foreground/70 max-w-sm mx-auto leading-relaxed',
							compact ? 'text-xs' : 'text-sm',
						)}
					>
						{description}
					</p>
				)}
			</div>
			{action && <div className="mt-2">{action}</div>}
		</div>
	)
}
