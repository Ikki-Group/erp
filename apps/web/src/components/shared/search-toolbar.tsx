import type { ReactNode } from 'react'
import { SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'

import { cn } from '@/lib/utils'

interface SearchToolbarProps {
	value?: string
	onChange?: (value: string) => void
	placeholder?: string
	actions?: ReactNode
	className?: string
}

export function SearchToolbar({
	value,
	onChange,
	placeholder = 'Search...',
	actions,
	className,
}: SearchToolbarProps) {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className="relative flex-1 sm:max-w-xs">
				<SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={value}
					onChange={(e) => onChange?.(e.target.value)}
					placeholder={placeholder}
					className="pl-7"
				/>
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	)
}
