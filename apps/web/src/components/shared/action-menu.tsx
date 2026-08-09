import type { ReactNode } from 'react'
import { MoreHorizontalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ActionMenuItem {
	label: string
	icon?: ReactNode
	onClick: () => void
	variant?: 'default' | 'destructive'
	disabled?: boolean
}

interface ActionMenuProps {
	items: ActionMenuItem[]
	label?: string
}

export function ActionMenu({ items, label = 'Actions' }: ActionMenuProps) {
	// Group items: regular first, destructive last (separated)
	const regularItems = items.filter((i) => i.variant !== 'destructive')
	const destructiveItems = items.filter((i) => i.variant === 'destructive')

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon-sm" aria-label={label} />
				}
			>
				<MoreHorizontalIcon className="size-4" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{regularItems.map((item) => (
					<DropdownMenuItem
						key={item.label}
						onClick={item.onClick}
						disabled={item.disabled}
					>
						{item.icon && <span className="mr-2 [&_svg]:size-4">{item.icon}</span>}
						{item.label}
					</DropdownMenuItem>
				))}
				{destructiveItems.length > 0 && regularItems.length > 0 && (
					<DropdownMenuSeparator />
				)}
				{destructiveItems.map((item) => (
					<DropdownMenuItem
						key={item.label}
						onClick={item.onClick}
						disabled={item.disabled}
						className="text-destructive focus:text-destructive"
					>
						{item.icon && <span className="mr-2 [&_svg]:size-4">{item.icon}</span>}
						{item.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
