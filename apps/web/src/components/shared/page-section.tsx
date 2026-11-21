import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageSectionProps {
	id?: string
	title?: string
	description?: string
	actions?: ReactNode
	children: ReactNode
	className?: string
}

export function PageSection({
	id,
	title,
	description,
	actions,
	children,
	className,
}: PageSectionProps) {
	return (
		<section id={id} className={cn('scroll-mt-24 space-y-4', className)}>
			{(title || actions) && (
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-0.5">
						{title && (
							<h2 className="font-heading text-sm font-semibold tracking-tight">{title}</h2>
						)}
						{description && (
							<p className="max-w-2xl text-xs text-muted-foreground">{description}</p>
						)}
					</div>
					{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
				</div>
			)}
			{children}
		</section>
	)
}
