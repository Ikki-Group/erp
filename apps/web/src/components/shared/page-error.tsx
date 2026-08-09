import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

interface PageErrorProps {
	title?: string
	message?: string
	onRetry?: () => void
	className?: string
}

export function PageError({
	title = 'Something went wrong',
	message = 'An unexpected error occurred. Please try again.',
	onRetry,
	className,
}: PageErrorProps) {
	return (
		<div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
			<div className="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
				<AlertCircleIcon className="size-5" />
			</div>
			<p className="text-sm font-medium">{title}</p>
			<p className="mt-1 max-w-sm text-xs text-muted-foreground">{message}</p>
			{onRetry && (
				<Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry}>
					<RefreshCwIcon className="size-3.5" />
					Retry
				</Button>
			)}
		</div>
	)
}
