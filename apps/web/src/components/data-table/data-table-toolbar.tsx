import type { ReactNode } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { cn } from '@/lib/utils'

interface DataTableToolbarProps {
	search?: string
	onSearchChange?: (value: string) => void
	searchPlaceholder?: string
	filters?: ReactNode
	actions?: ReactNode
	className?: string
}

export function DataTableToolbar({
	search,
	onSearchChange,
	searchPlaceholder = 'Search...',
	filters,
	actions,
	className,
}: DataTableToolbarProps) {
	return (
		<div className={cn('flex flex-wrap items-center gap-2', className)}>
			{onSearchChange && (
				<div className="relative flex-1 sm:max-w-xs">
					<SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search ?? ''}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="pl-7 pr-7"
					/>
					{search && (
						<Button
							variant="ghost"
							size="icon-xs"
							className="absolute right-1.5 top-1/2 -translate-y-1/2"
							onClick={() => onSearchChange('')}
							aria-label="Clear search"
						>
							<XIcon className="size-3" />
						</Button>
					)}
				</div>
			)}
			{filters && <div className="flex items-center gap-2">{filters}</div>}
			{actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
		</div>
	)
}
