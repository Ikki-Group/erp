import { format } from 'date-fns'
import { HistoryIcon } from 'lucide-react'

import {
	Timeline,
	TimelineContent,
	TimelineDate,
	TimelineHeader,
	TimelineIndicator,
	TimelineItem,
	TimelineSeparator,
	TimelineTitle,
} from '@/components/reui/timeline'

import { Skeleton } from '@/components/ui/skeleton'

import type { AuditLogDto } from '@/features/audit/dto/index.ts'

import { EmptyState } from './empty-state.tsx'

export interface AuditTrailProps {
	entries: AuditLogDto[]
	isLoading?: boolean
	emptyMessage?: string
	className?: string
}

const ACTION_LABELS: Record<string, string> = {
	create: 'Created',
	update: 'Updated',
	delete: 'Deleted',
	confirm: 'Confirmed',
	complete: 'Completed',
	ship: 'Shipped',
	receive: 'Received',
	void: 'Voided',
	'close-other': 'Closed (by manager)',
}

function formatAction(action: string): string {
	return ACTION_LABELS[action] ?? action.charAt(0).toUpperCase() + action.slice(1)
}

/**
 * Chronological activity log for a single entity, rendered on `reui/timeline.tsx`.
 * The underlying Timeline primitive is step-driven (an item is "completed" if
 * `step <= activeStep`) for wizard-style progress UIs — this component isn't
 * that, so every item is simply given a `step` at or below `activeStep` to
 * render its indicator as always-filled, and step/value navigation is unused.
 * Entries are expected pre-sorted newest-first (as returned by
 * `auditResource.byEntity`).
 */
export function AuditTrail({
	entries,
	isLoading,
	emptyMessage = 'No activity recorded yet.',
	className,
}: AuditTrailProps) {
	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
			</div>
		)
	}

	if (entries.length === 0) {
		return (
			<EmptyState
				title="No activity yet"
				description={emptyMessage}
				icon={<HistoryIcon className="size-5" />}
			/>
		)
	}

	return (
		<Timeline value={entries.length} className={className}>
			{entries.map((entry, index) => (
				<TimelineItem key={entry.id} step={index + 1}>
					<TimelineSeparator />
					<TimelineIndicator />
					<TimelineHeader>
						<TimelineDate>{format(entry.timestamp, 'dd MMM yyyy, HH:mm')}</TimelineDate>
						<TimelineTitle>{formatAction(entry.action)}</TimelineTitle>
					</TimelineHeader>
					<TimelineContent>
						{entry.summary} — <span className="font-medium">{entry.userName}</span>
					</TimelineContent>
				</TimelineItem>
			))}
		</Timeline>
	)
}
