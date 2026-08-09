import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface StatCardProps {
	title: string
	value: string | number
	description?: string
	icon?: ReactNode
	trend?: { value: string; positive?: boolean }
	className?: string
}

export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
	return (
		<div className={cn('rounded-lg border bg-card p-4 text-card-foreground', className)}>
			<div className="flex items-center justify-between">
				<p className="text-xs font-medium text-muted-foreground">{title}</p>
				{icon && <div className="text-muted-foreground">{icon}</div>}
			</div>
			<div className="mt-2 flex items-baseline gap-2">
				<p className="text-2xl font-semibold tracking-tight">{value}</p>
				{trend && (
					<span
						className={cn(
							'text-xs font-medium',
							trend.positive ? 'text-success' : 'text-destructive',
						)}
					>
						{trend.value}
					</span>
				)}
			</div>
			{description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
		</div>
	)
}
