import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DataListProps {
	children: ReactNode
	className?: string
	cols?: 1 | 2 | 3 | 4
}

/**
 * A responsive list for displaying key-value pairs (data points).
 */
export function DataList({ children, className, cols = 3 }: DataListProps) {
	const gridCols = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
	}[cols]

	return <div className={cn('grid gap-y-6 gap-x-4', gridCols, className)}>{children}</div>
}

interface DataListItemProps {
	label: string
	value?: ReactNode
	className?: string
	children?: ReactNode
	span?: 1 | 2 | 3 | 4
}

function DataListItem({ label, value, children, className, span = 1 }: DataListItemProps) {
	const colSpan = {
		1: 'col-span-1',
		2: 'col-span-1 sm:col-span-2',
		3: 'col-span-1 md:col-span-3',
		4: 'col-span-1 lg:col-span-4',
	}[span]

	return (
		<div className={cn('flex flex-col gap-1', colSpan, className)}>
			<span className="text-xs font-medium text-muted-foreground tracking-wider">{label}</span>
			<div className="font-medium">{value ?? children}</div>
		</div>
	)
}

DataList.Item = DataListItem
