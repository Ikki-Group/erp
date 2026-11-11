import type { ReactNode } from 'react'

import { ArrowLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface MasterDetailPageProps {
	list: ReactNode
	detail?: ReactNode
	selectedId: string | number | null | undefined
	onSelectedIdChange: (id: string | number | null) => void
	backLabel?: string
	className?: string
}

/** Responsive master/detail composition. Mobile shows a back action for the detail pane. */
export function MasterDetailPage({
	list,
	detail,
	selectedId,
	onSelectedIdChange,
	backLabel = 'Back to list',
	className,
}: MasterDetailPageProps) {
	return (
		<div className={className}>
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
				<div
					className={
						selectedId !== null && selectedId !== undefined ? 'hidden lg:block' : undefined
					}
				>
					{list}
				</div>
				{detail && selectedId !== null && selectedId !== undefined && (
					<div className="min-w-0">
						<div className="mb-4 lg:hidden">
							<Button
								variant="ghost"
								size="sm"
								className="-ml-2 gap-1.5"
								onClick={() => onSelectedIdChange(null)}
							>
								<ArrowLeftIcon className="size-3.5" />
								{backLabel}
							</Button>
						</div>
						{detail}
					</div>
				)}
			</div>
		</div>
	)
}
