import { type ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ChartCard({
	title,
	children,
	isLoading,
}: {
	title: string
	children: ReactNode
	isLoading?: boolean
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex items-center justify-center h-80">
						<Skeleton className="h-full w-full" />
					</div>
				) : (
					<div className="w-full h-80">{children}</div>
				)}
			</CardContent>
		</Card>
	)
}
