import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'

interface PageSkeletonProps {
	className?: string
}

export function PageSkeleton({ className }: PageSkeletonProps) {
	return (
		<div className={cn('space-y-4', className)}>
			<Skeleton className="h-8 w-48" />
			<Skeleton className="h-4 w-72" />
			<div className="mt-6 space-y-3">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		</div>
	)
}
