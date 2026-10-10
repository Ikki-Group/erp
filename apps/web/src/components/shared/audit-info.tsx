import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AuditInfoProps {
	createdAt: string | Date
	createdBy?: string | number | null
	updatedAt?: string | Date | null
	updatedBy?: string | number | null
	className?: string
}

/**
 * Compact audit metadata for detail cards.
 * Shows "Created by X • date" with optional "Updated by X • date" on the next line.
 */
export function AuditInfo({
	createdAt,
	createdBy,
	updatedAt,
	updatedBy,
	className,
}: AuditInfoProps) {
	const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
	const showUpdated = updatedAt && updatedBy && updatedBy !== createdBy
	const updatedDate = updatedAt
		? typeof updatedAt === 'string'
			? new Date(updatedAt)
			: updatedAt
		: null

	// Format user reference (name or "User #id")
	const formatUser = (user: string | number | null | undefined) => {
		if (!user) return ''
		return typeof user === 'number' ? `User #${user}` : user
	}

	return (
		<div className={cn('space-y-1 text-xs text-muted-foreground', className)}>
			<div className="flex items-center gap-2">
				<CalendarIcon className="size-3.5" />
				<span>
					Created{createdBy ? ` by ${formatUser(createdBy)}` : ''} •{' '}
					{format(createdDate, 'dd MMM yyyy')}
				</span>
			</div>
			{showUpdated && updatedDate && (
				<div className="flex items-center gap-2 pl-5">
					<span>
						Updated by {formatUser(updatedBy)} • {format(updatedDate, 'dd MMM yyyy')}
					</span>
				</div>
			)}
		</div>
	)
}
