import type { ReactNode } from 'react'

import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { IconTile } from '@/components/reui/icon-tile'

import { Skeleton } from '@/components/ui/skeleton'

export type StatCardTone = 'default' | 'success' | 'warning' | 'info' | 'destructive'

/**
 * Maps tone to semantic color classes for icons.
 * Used by both StatCard and DataCard for consistent icon tinting.
 */
export const TONE_CLASS: Record<StatCardTone, string> = {
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

/** A Warm Precision metric surface; only actionable cards enter the tab order. */
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
				'rounded-xl border border-border bg-card text-card-foreground',
				'p-6 transition-colors',
				'hover:border-border/80',
				onClick &&
					'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40 hover:bg-muted/30',
				className,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1">
					<p className="text-xs font-medium text-muted-foreground">{title}</p>
				</div>
				{icon && (
					<IconTile variant="soft" size="sm" className={cn(TONE_CLASS[tone])}>
						{icon}
					</IconTile>
				)}
			</div>

			{isLoading ? (
				<div className="mt-6 space-y-3">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-4 w-32" />
				</div>
			) : (
				<div className="mt-6 space-y-0.5">
					<div className="flex flex-wrap items-baseline justify-end gap-3">
						<p className="text-right font-mono text-2xl font-semibold tracking-tight tabular-nums">
							{typeof value === 'number' ? value.toLocaleString('id-ID') : value}
						</p>
						{trend && (
							<span
								className={cn(
									'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
									trendPositive ? 'text-success' : 'text-destructive',
								)}
							>
								{trendDirection === 'up' ? (
									<ArrowUpRightIcon className="size-3.5" />
								) : (
									<ArrowDownRightIcon className="size-3.5" />
								)}
								{trend.value}
							</span>
						)}
					</div>
					{description && <p className="text-xs text-muted-foreground">{description}</p>}
				</div>
			)}
		</div>
	)
}
