import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { PageHeader } from './page-header'
import { PageSection } from './page-section'

export interface DetailPageProps {
	title: string
	description?: string
	breadcrumbs?: ReactNode
	status?: ReactNode
	actions?: ReactNode
	children: ReactNode
	className?: string
}

export function DetailPage({
	title,
	description,
	breadcrumbs,
	status,
	actions,
	children,
	className,
}: DetailPageProps) {
	return (
		<div className={cn('space-y-6', className)}>
			{breadcrumbs}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
				<PageHeader title={title} description={description} className="min-w-0" />
				<div className="flex max-w-full flex-wrap items-center gap-2 sm:shrink-0">
					{status}
					{actions}
				</div>
			</div>
			{children}
		</div>
	)
}

export interface DetailSectionProps {
	title?: string
	description?: string
	actions?: ReactNode
	children: ReactNode
	className?: string
}

export function DetailSection(props: DetailSectionProps) {
	return <PageSection {...props} />
}
