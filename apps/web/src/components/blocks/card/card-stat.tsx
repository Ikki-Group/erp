import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Skeleton } from '@/components/ui/skeleton'

export interface CardStatProps {
	title: string
	value: string | number
	icon: LucideIcon
	description?: string
	isLoading?: boolean
	className?: string
}

export function CardStat({
	title,
	value,
	icon: Icon,
	description,
	isLoading,
	className,
}: CardStatProps) {
	return (
		<div
			className={cn(
				'flex flex-1 items-center gap-2 p-2 rounded-xl border bg-card text-card-foreground min-w-50 transition-all',
				className,
			)}
		>
			<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
				<Icon className="size-4 text-primary" />
			</div>
			<div className="grid gap-0.5">
				<p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
					{title}
				</p>
				<div className="flex items-baseline gap-2">
					<p className="text-sm font-bold">
						{isLoading ? <Skeleton className="w-20 h-4" /> : value}
					</p>
					{description && <span className="text-[10px] text-muted-foreground">{description}</span>}
				</div>
			</div>
		</div>
	)
}
