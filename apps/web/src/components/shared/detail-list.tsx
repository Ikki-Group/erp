import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type DetailListAlign = 'left' | 'right'

interface DetailListItem {
	label: string
	value: ReactNode
	/** Align the value — use 'right' for numeric/currency cells. Defaults to 'left'. */
	align?: DetailListAlign
}

interface DetailListProps {
	items: DetailListItem[]
	/** Number of label/value pairs per row. Defaults to 2. */
	columns?: 1 | 2 | 3
	className?: string
}

export function DetailList({ items, columns = 2, className }: DetailListProps) {
	return (
		<dl
			className={cn(
				'grid gap-x-6 gap-y-3',
				{
					'grid-cols-2': columns === 1,
					'grid-cols-4': columns === 2,
					'grid-cols-6': columns === 3,
				},
				className,
			)}
		>
			{items.map((item) => (
				<>
					<dt key={`${item.label}-label`} className="text-xs text-muted-foreground">
						{item.label}
					</dt>
					<dd
						key={`${item.label}-value`}
						className={cn('text-sm font-medium', item.align === 'right' && 'text-right')}
					>
						{item.value}
					</dd>
				</>
			))}
		</dl>
	)
}
