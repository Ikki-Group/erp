import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

import { TONE_CLASS } from '../metrics.ts'
import type { MetricDef } from '../metrics.ts'
import { useLocationContext } from '@/providers/location-provider.tsx'

const NUMBER = 'font-mono tabular-nums'

/** A count as plain text: muted when zero. Used for totals, which can't drill into one location. */
export function CountValue({ value, metric }: { value: number; metric: MetricDef }) {
	return (
		<span className={cn(NUMBER, value === 0 ? 'text-muted-foreground' : TONE_CLASS[metric.tone])}>
			{value}
		</span>
	)
}

interface CountLinkProps {
	value: number
	metric: MetricDef
	location: { id: number; name: string }
	className?: string
}

/**
 * A non-zero count drills in: switch the active location, then open the
 * matching list. Zero stays an inert muted `0`.
 */
export function CountLink({ value, metric, location, className }: CountLinkProps) {
	const { switchLocation } = useLocationContext()
	if (value === 0) return <CountValue value={0} metric={metric} />
	return (
		<Link
			{...metric.target}
			onClick={() => switchLocation(location.id)}
			aria-label={`${value} ${metric.label.toLowerCase()} di ${location.name}`}
			className={cn(
				NUMBER,
				// A drillable neutral count reads as a link (the one accent); warning/destructive keep their status color.
				metric.tone === 'default' ? 'text-primary' : TONE_CLASS[metric.tone],
				'-mx-1.5 inline-flex items-center justify-end rounded-sm px-1.5 py-0.5 underline-offset-4 outline-none hover:bg-muted hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 pointer-coarse:min-h-10 pointer-coarse:min-w-10',
				className,
			)}
		>
			{value}
		</Link>
	)
}
