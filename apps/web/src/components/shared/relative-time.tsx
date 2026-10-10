import { useEffect, useState } from 'react'

import { format, formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface RelativeTimeProps {
	/** The timestamp to render relative to now. */
	value: Date | string
	/** Appends "ago". Defaults to `true`. */
	addSuffix?: boolean
	/**
	 * Re-renders on this interval (ms) so "2 minutes ago" keeps ticking
	 * forward without a page refresh — e.g. for an activity feed left open.
	 * Pass `false` to render once and never update.
	 */
	refreshInterval?: number | false
	className?: string
}

/**
 * Formats a timestamp as "2 minutes ago" / "3 hours ago", with the absolute
 * date/time available on hover via `Tooltip`. Backed by `date-fns` instead of
 * hand-rolled minute/hour math — see the activity feed in
 * `routes/_authenticated/index.tsx` for the pattern this replaces.
 */
export function RelativeTime({
	value,
	addSuffix = true,
	refreshInterval = 60_000,
	className,
}: RelativeTimeProps) {
	const date = value instanceof Date ? value : new Date(value)
	// Forces a re-render every `refreshInterval` so the relative label keeps
	// advancing; the actual text is always recomputed from `date`, not stored.
	const [, setTick] = useState(0)

	useEffect(() => {
		if (refreshInterval === false) return
		const timer = window.setInterval(() => setTick((t) => t + 1), refreshInterval)
		return () => window.clearInterval(timer)
	}, [refreshInterval])

	if (Number.isNaN(date.getTime())) {
		return <span className={className}>—</span>
	}

	const relative = formatDistanceToNow(date, { addSuffix, locale: idLocale })
	const absolute = format(date, 'dd MMM yyyy, HH:mm', { locale: idLocale })

	return (
		<Tooltip>
			<TooltipTrigger render={<span className={className} />}>{relative}</TooltipTrigger>
			<TooltipContent>{absolute}</TooltipContent>
		</Tooltip>
	)
}
