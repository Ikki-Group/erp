import type { ReactNode } from 'react'

import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Skeleton } from '@/components/ui/skeleton'

export type MetricCardTone = 'default' | 'success' | 'warning' | 'info' | 'destructive'

const TONE_TEXT: Record<MetricCardTone, string | undefined> = {
	default: undefined,
	success: 'text-success',
	warning: 'text-warning',
	info: 'text-info',
	destructive: 'text-destructive',
}

interface MetricCardTrend {
	value: string
	/** Arrow direction. Defaults to inferring from a leading '-' in `value` (else 'up'). */
	direction?: 'up' | 'down'
	/** Tints the trend success (true, default) or destructive (false), independent of `direction`. */
	positive?: boolean
}

export interface MetricCardProps {
	title: string
	description?: string
	/** Metric mode: the headline number. Omit (with `children`) for a titled panel. */
	value?: string | number
	trend?: MetricCardTrend
	/** Small inline glyph before the title. Plain icon, never a tile. */
	icon?: ReactNode
	/** Tints the value and icon when the metric carries meaning (e.g. low stock → warning). */
	tone?: MetricCardTone
	/** Skeleton in place of the value / body while the backing query loads. */
	isLoading?: boolean
	/** Makes the whole card a keyboard-operable button (metric mode only). */
	onClick?: () => void
	actions?: ReactNode
	/** Panel mode body, separated from the header by one hairline. */
	children?: ReactNode
	/** Drop the body padding, e.g. for a flush list or table. */
	noPadding?: boolean
	className?: string
}

/**
 * The one inline card for dashboards: a metric tile (`value`) or a titled
 * panel (`children`). One hairline border, no shadow, no icon tile, nothing
 * nested inside a second card.
 */
export function MetricCard({
	title,
	description,
	value,
	trend,
	icon,
	tone = 'default',
	isLoading = false,
	onClick,
	actions,
	children,
	noPadding,
	className,
}: MetricCardProps) {
	const isMetric = value !== undefined
	const toneText = TONE_TEXT[tone]
	const glyph = icon && (
		<span
			aria-hidden="true"
			className={cn('shrink-0 [&_svg]:size-3.5', toneText ?? 'text-muted-foreground')}
		>
			{icon}
		</span>
	)

	if (!isMetric) {
		return (
			<section
				data-slot="metric-card"
				className={cn('min-w-0 rounded-lg border bg-card text-card-foreground', className)}
			>
				<header className="flex items-start justify-between gap-4 border-b px-4 py-3">
					<div className="min-w-0 space-y-0.5">
						<h3 className="flex items-center gap-1.5 font-heading text-sm font-semibold tracking-tight">
							{glyph}
							{title}
						</h3>
						{description && <p className="text-xs text-muted-foreground">{description}</p>}
					</div>
					{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
				</header>
				<div className={cn(!noPadding && 'p-4')}>{children}</div>
			</section>
		)
	}

	const trendDirection =
		trend && (trend.direction ?? (trend.value.trim().startsWith('-') ? 'down' : 'up'))

	return (
		<div
			data-slot="metric-card"
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
				'min-w-0 rounded-lg border bg-card p-4 text-card-foreground transition-colors',
				onClick &&
					'cursor-pointer outline-none hover:border-foreground/15 focus-visible:ring-2 focus-visible:ring-ring/50',
				className,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
					{glyph}
					<span className="truncate">{title}</span>
				</p>
				{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
			</div>
			{isLoading ? (
				<div className="mt-3 space-y-2">
					<Skeleton className="h-7 w-20" />
					<Skeleton className="h-3.5 w-28" />
				</div>
			) : (
				<div className="mt-3 space-y-0.5">
					<div className="flex items-baseline gap-2">
						<p className={cn('text-2xl font-semibold tracking-tight tabular-nums', toneText)}>
							{value}
						</p>
						{trend && (
							<span
								className={cn(
									'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
									(trend.positive ?? true) ? 'text-success' : 'text-destructive',
								)}
							>
								{trendDirection === 'up' ? (
									<ArrowUpRightIcon aria-hidden="true" className="size-3.5" />
								) : (
									<ArrowDownRightIcon aria-hidden="true" className="size-3.5" />
								)}
								{trend.value}
							</span>
						)}
					</div>
					{description && <p className="text-xs text-muted-foreground">{description}</p>}
				</div>
			)}
			{children}
		</div>
	)
}
