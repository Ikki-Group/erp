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
				'flex flex-1 items-center gap-4 p-4 rounded-xl border bg-card text-card-foreground min-w-50 transition-all duration-300 shadow-card hover:shadow-deep',
				className,
			)}
		>
			<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/10">
				<Icon className="size-[18px] text-primary" />
			</div>
			<div className="grid gap-1">
				<p className="text-badge uppercase text-muted-foreground">
					{title}
				</p>
				<div className="flex items-baseline gap-2.5">
					<p className="text-base font-bold tracking-tight">
						{isLoading ? <Skeleton className="w-24 h-5" /> : value}
					</p>
					{description && (
						<span className="text-micro text-muted-foreground/80">{description}</span>
					)}
				</div>
			</div>
		</div>
	)
}
