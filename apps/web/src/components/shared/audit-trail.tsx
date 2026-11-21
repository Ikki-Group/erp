import { format } from 'date-fns'
import { HistoryIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
	Timeline,
	TimelineContent,
	TimelineDate,
	TimelineHeader,
	TimelineIndicator,
	TimelineItem,
	TimelineSeparator,
} from '@/components/reui/timeline'

import { Skeleton } from '@/components/ui/skeleton'

import type { AuditLogDto } from '@/features/audit/dto/index.ts'

import { EmptyState } from './empty-state.tsx'
import { RelativeTime } from './relative-time'
import { StatusBadge } from './status-badge'

export interface AuditTrailProps {
	entries: AuditLogDto[]
	isLoading?: boolean
	emptyMessage?: string
	className?: string
}

type StatusBadgeVariant = 'default' | 'info' | 'warning' | 'success' | 'destructive' | 'outline'

const ACTION_LABELS: Record<string, string> = {
	create: 'Dibuat',
	update: 'Diperbarui',
	delete: 'Dihapus',
	confirm: 'Dikonfirmasi',
	complete: 'Selesai',
	ship: 'Dikirim',
	receive: 'Diterima',
	void: 'Dibatalkan',
	'close-other': 'Ditutup (oleh manajer)',
	'reset-password': 'Reset kata sandi',
}

const ACTION_VARIANTS: Record<string, StatusBadgeVariant> = {
	create: 'success',
	update: 'info',
	delete: 'destructive',
	confirm: 'success',
	complete: 'success',
	ship: 'info',
	receive: 'success',
	void: 'destructive',
	'close-other': 'warning',
	'reset-password': 'info',
} satisfies Record<string, StatusBadgeVariant>

function formatAction(action: string): string {
	return ACTION_LABELS[action] ?? action.charAt(0).toUpperCase() + action.slice(1)
}

function getActionVariant(action: string): StatusBadgeVariant {
	return ACTION_VARIANTS[action] ?? 'default'
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
	emptyMessage = 'Belum ada aktivitas tercatat.',
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
				title="Belum ada aktivitas"
				description={emptyMessage}
				icon={<HistoryIcon className="size-5" />}
			/>
		)
	}

	return (
		<Timeline value={entries.length} className={cn('space-y-1', className)}>
			{entries.map((entry, index) => (
				<TimelineItem
					key={entry.id}
					step={index + 1}
					className="group-data-[orientation=vertical]/timeline:ms-6"
				>
					<TimelineSeparator />
					<TimelineIndicator
						className={cn(
							'size-3 border-2 transition-colors',
							index === 0 ? 'bg-primary border-primary' : 'bg-background border-primary/20',
						)}
					/>
					<TimelineHeader className="flex items-start gap-3">
						<div className="flex flex-col gap-1 min-w-[140px] shrink-0">
							<TimelineDate className="text-xs text-muted-foreground whitespace-nowrap">
								{format(entry.timestamp, 'dd MMM yyyy, HH:mm')}
							</TimelineDate>
							<RelativeTime value={entry.timestamp} className="text-xs text-muted-foreground" />
						</div>
						<div className="flex items-center gap-2">
							<StatusBadge
								variant={getActionVariant(entry.action)}
								className="px-1.5 py-0 text-[10px]"
							>
								{formatAction(entry.action)}
							</StatusBadge>
						</div>
					</TimelineHeader>
					<TimelineContent className="ms-[calc(140px+2rem)] group-data-[orientation=vertical]/timeline:ms-0 text-sm">
						<p className="text-foreground">{entry.summary}</p>
						<p className="text-xs text-muted-foreground">
							<span className="font-medium">{entry.userName}</span> · {entry.module} /{' '}
							{entry.entity}
						</p>
					</TimelineContent>
				</TimelineItem>
			))}
		</Timeline>
	)
}
