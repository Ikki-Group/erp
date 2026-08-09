import type { ReactNode } from 'react'
import { AlertCircleIcon, InboxIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'

interface DataTableLoadingProps {
	rows?: number
	columns?: number
	className?: string
}

/** Full-page loading skeleton before table data is available. */
export function DataTableLoading({ rows = 5, columns = 4, className }: DataTableLoadingProps) {
	return (
		<div className={cn('space-y-4', className)}>
			{/* Toolbar skeleton */}
			<div className="flex items-center gap-2">
				<Skeleton className="h-7 w-56" />
				<div className="ml-auto">
					<Skeleton className="h-7 w-24" />
				</div>
			</div>
			{/* Table skeleton */}
			<div className="rounded-lg border">
				{/* Header */}
				<div className="flex gap-4 border-b bg-muted/30 px-4 py-2.5">
					{Array.from({ length: columns }).map((_, i) => (
						<Skeleton key={i} className="h-4 flex-1" />
					))}
				</div>
				{/* Rows */}
				{Array.from({ length: rows }).map((_, i) => (
					<div key={i} className="flex gap-4 border-b px-4 py-3 last:border-b-0">
						{Array.from({ length: columns }).map((_, j) => (
							<Skeleton key={j} className="h-4 flex-1" />
						))}
					</div>
				))}
			</div>
		</div>
	)
}

interface DataTableErrorProps {
	title?: string
	message?: string
	onRetry?: () => void
	className?: string
}

/** Error state when table data fails to load. */
export function DataTableError({
	title = 'Failed to load data',
	message = 'Something went wrong. Please try again.',
	onRetry,
	className,
}: DataTableErrorProps) {
	return (
		<div className={cn('flex flex-col items-center justify-center rounded-lg border py-16', className)}>
			<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
				<AlertCircleIcon className="size-5" />
			</div>
			<p className="text-sm font-medium">{title}</p>
			<p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">{message}</p>
			{onRetry && (
				<Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry}>
					<RefreshCwIcon className="size-3.5" />
					Retry
				</Button>
			)}
		</div>
	)
}

interface DataTableEmptyProps {
	title?: string
	description?: string
	icon?: ReactNode
	action?: ReactNode
	className?: string
}

/** Empty state when table query returns zero results. */
export function DataTableEmpty({
	title = 'No records found',
	description = 'Try adjusting your search or filter criteria.',
	icon,
	action,
	className,
}: DataTableEmptyProps) {
	return (
		<div className={cn('flex flex-col items-center justify-center rounded-lg border py-16', className)}>
			<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
				{icon ?? <InboxIcon className="size-5" />}
			</div>
			<p className="text-sm font-medium">{title}</p>
			<p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">{description}</p>
			{action && <div className="mt-4">{action}</div>}
		</div>
	)
}
