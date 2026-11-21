import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { PageHeader } from './page-header'

export interface PageShellProps {
	title: string
	description?: string
	actions?: ReactNode
	children: ReactNode
	className?: string
	contentClassName?: string
}

/** The standard outer composition for authenticated pages. */
export function PageShell({
	title,
	description,
	actions,
	children,
	className,
	contentClassName,
}: PageShellProps) {
	return (
		<div className={cn('space-y-6', className)}>
			<PageHeader title={title} description={description} actions={actions} />
			<div className={cn('min-w-0', contentClassName)}>{children}</div>
		</div>
	)
}
