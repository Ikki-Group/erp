import { ChevronsUpDownIcon, LogOutIcon, MapPinIcon, UserIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function AppHeader() {
	return (
		<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mx-2 h-6" />

			{/* Location switcher placeholder */}
			<Button variant="outline" size="sm" className="gap-1.5 text-sm font-normal">
				<MapPinIcon className="size-4 text-muted-foreground" />
				<span>All Locations</span>
				<ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
			</Button>

			<div className="flex-1" />

			{/* User menu */}
			<DropdownMenu>
				<DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent">
					<Avatar size="sm">
						<AvatarFallback>AD</AvatarFallback>
					</Avatar>
					<span className="hidden md:inline">Admin</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" sideOffset={8}>
					<DropdownMenuItem>
						<UserIcon className="mr-2 size-4" />
						Profile
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<LogOutIcon className="mr-2 size-4" />
						Logout
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	)
}
