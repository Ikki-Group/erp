import { InboxIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface TableEmptyStateProps {
	title?: string
	description?: string
	actionLabel?: string
	onAction?: () => void
}

export function TableEmptyState({
	title = 'Tidak ada data',
	description = 'Belum ada data yang tersedia saat ini.',
	actionLabel,
	onAction,
}: TableEmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="flex size-16 items-center justify-center rounded-full bg-muted">
				<InboxIcon className="size-8 text-muted-foreground" />
			</div>
			<h3 className="mt-4 text-lg font-semibold">{title}</h3>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
			{actionLabel && onAction && (
				<Button onClick={onAction} className="mt-4">
					{actionLabel}
				</Button>
			)}
		</div>
	)
}
