import { cn } from '@/lib/utils'

export interface SegmentedBarItem {
	label: string
	value: number
	color?: string
	/** Tailwind bg class. Falls back to color var if not provided. */
	className?: string
}

export interface SegmentedBarProps {
	items: SegmentedBarItem[]
	/** Height of the bar. Defaults to 'h-2.5'. */
	height?: string
	/** Show value labels below the bar. */
	showLabels?: boolean
	className?: string
}

/**
 * Horizontal stacked bar showing proportional breakdown.
 * Useful for: helpful rate, stock category distribution, order status split.
 */
export function SegmentedBar({
	items,
	height = 'h-2.5',
	showLabels = true,
	className,
}: SegmentedBarProps) {
	const total = items.reduce((sum, item) => sum + item.value, 0)

	if (total === 0) {
		return (
			<div className={cn('space-y-2', className)}>
				<div className={cn('w-full rounded-full bg-muted', height)} />
			</div>
		)
	}

	return (
		<div className={cn('space-y-2', className)}>
			<div className={cn('flex w-full overflow-hidden rounded-full', height)}>
				{items.map((item) => {
					const pct = (item.value / total) * 100
					if (pct === 0) return null
					return (
						<div
							key={item.label}
							className={cn('transition-all', item.className)}
							style={{
								width: `${pct}%`,
								backgroundColor: !item.className ? (item.color ?? 'var(--primary)') : undefined,
							}}
						/>
					)
				})}
			</div>
			{showLabels && (
				<div className="flex gap-4">
					{items.map((item) => (
						<div key={item.label} className="flex items-center gap-1.5">
							<span
								className={cn('size-2 rounded-full', item.className)}
								style={{
									backgroundColor: !item.className ? (item.color ?? 'var(--primary)') : undefined,
								}}
							/>
							<span className="text-xs text-muted-foreground">
								<span className="font-medium text-foreground">{item.value}</span>{' '}
								{item.label}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
