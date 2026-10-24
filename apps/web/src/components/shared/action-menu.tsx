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

export interface ActionMenuItem {
	label: string
	icon?: ReactNode
	onClick: () => void
	variant?: 'default' | 'destructive'
	disabled?: boolean
}

export interface ActionMenuProps {
	items: ActionMenuItem[]
	/** Accessible label for the trigger button. */
	label?: string
	/** Alignment of the dropdown. */
	align?: 'start' | 'end' | 'center'
	className?: string
}

export function ActionMenu({
	items,
	label = 'Actions',
	align = 'end',
	className,
}: ActionMenuProps) {
	const regularItems = items.filter((i) => i.variant !== 'destructive')
	const destructiveItems = items.filter((i) => i.variant === 'destructive')

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button variant="ghost" size="icon-sm" aria-label={label} className={className} />}
			>
				<MoreHorizontalIcon className="size-4" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align={align}>
				{regularItems.map((item) => (
					<DropdownMenuItem key={item.label} onClick={item.onClick} disabled={item.disabled}>
						{item.icon && <span className="mr-2 [&_svg]:size-4">{item.icon}</span>}
						{item.label}
					</DropdownMenuItem>
				))}
				{destructiveItems.length > 0 && regularItems.length > 0 && <DropdownMenuSeparator />}
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
