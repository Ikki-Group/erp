import type { ReactNode } from 'react'

import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { IconTile } from '@/components/reui/icon-tile'

import { Skeleton } from '@/components/ui/skeleton'

type StatCardTone = 'default' | 'success' | 'warning' | 'info' | 'destructive'

const TONE_CLASS: Record<StatCardTone, string> = {
	default: 'text-primary',
	success: 'text-success',
	warning: 'text-warning',
	info: 'text-info',
	destructive: 'text-destructive',
}

interface StatCardTrend {
	value: string
	/** Arrow direction. Defaults to inferring from a leading '+'/'-' in `value` (falls back to 'up'). */
	direction?: 'up' | 'down'
	/** Tints the trend success (true, default) or destructive (false) — independent of `direction`, since an uptick isn't always good news (e.g. a rising low-stock count). */
	positive?: boolean
}

interface StatCardProps {
	title: string
	value: string | number
	description?: string
	icon?: ReactNode
	trend?: StatCardTrend
	/** Tints the icon tile to match the metric's meaning. Defaults to the brand color. */
	tone?: StatCardTone
	/** Shows skeleton placeholders instead of value/trend/description — e.g. while the backing query loads. */
	isLoading?: boolean
	/** Makes the whole card an actionable, keyboard-operable button (e.g. navigate to the detail list). */
	onClick?: () => void
	className?: string
}

export function StatCard({
	title,
	value,
	description,
	icon,
	trend,
	tone = 'default',
	isLoading = false,
	onClick,
	className,
}: StatCardProps) {
	const trendDirection =
		trend && (trend.direction ?? (trend.value.trim().startsWith('-') ? 'down' : 'up'))
	const trendPositive = trend?.positive ?? true

	return (
		<div
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
			onClick={onClick}
			onKeyDown={
				onClick
					? (e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								onClick()
							}
						}
					: undefined
			}
			className={cn(
				'rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:border-foreground/15',
				onClick && 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<p className="text-xs font-medium text-muted-foreground">{title}</p>
				{icon && (
					<IconTile variant="soft" size="sm" className={TONE_CLASS[tone]}>
						{icon}
					</IconTile>
				)}
			</div>

			{isLoading ? (
				<div className="mt-3 space-y-2">
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-3 w-28" />
				</div>
			) : (
				<>
					<div className="mt-3 flex items-baseline gap-2">
						<p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
						{trend && (
							<span
								className={cn(
									'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
									trendPositive ? 'text-success' : 'text-destructive',
								)}
							>
								{trendDirection === 'up' ? (
									<ArrowUpRightIcon className="size-3" />
								) : (
									<ArrowDownRightIcon className="size-3" />
								)}
								{trend.value}
							</span>
						)}
					</div>
					{description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
				</>
			)}
		</div>
	)
}
