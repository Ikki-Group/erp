import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { EmptyState, PageError, PageSection } from '@/components/shared'

import { Skeleton } from '@/components/ui/skeleton'

interface PanelProps<T> {
	title: string
	description?: string
	action?: ReactNode
	query: { isLoading: boolean; isError: boolean; refetch: () => unknown }
	items: T[]
	getKey: (item: T) => string | number
	renderItem: (item: T) => ReactNode
	empty: { title: string; description?: string }
	errorMessage: string
	className?: string
}

/**
 * One flat dashboard section: an h2 header and a single hairline surface with
 * divided rows. Error is checked before empty.
 */
export function Panel<T>({
	title,
	description,
	action,
	query,
	items,
	getKey,
	renderItem,
	empty,
	errorMessage,
	className,
}: PanelProps<T>) {
	return (
		<PageSection
			title={title}
			description={description}
			actions={action}
			className={cn('space-y-2', className)}
		>
			<div className="overflow-hidden rounded-lg border bg-card">
				{query.isLoading ? (
					<div className="divide-y" aria-busy="true">
						{[0, 1, 2].map((i) => (
							<div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
								<Skeleton className="h-4 w-40" />
								<Skeleton className="h-4 w-12" />
							</div>
						))}
					</div>
				) : query.isError ? (
					<PageError
						className="py-6"
						title="Gagal memuat"
						message={errorMessage}
						onRetry={() => void query.refetch()}
					/>
				) : items.length === 0 ? (
					<EmptyState className="py-6" title={empty.title} description={empty.description} />
				) : (
					<ul className="divide-y">
						{items.map((item) => (
							<li
								key={getKey(item)}
								className="flex items-center justify-between gap-3 px-4 py-2.5"
							>
								{renderItem(item)}
							</li>
						))}
					</ul>
				)}
			</div>
		</PageSection>
	)
}
