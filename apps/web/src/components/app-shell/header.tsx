import { CheckIcon, ChevronsUpDownIcon, LogOutIcon, MapPinIcon, UserIcon } from 'lucide-react'

import { ThemeToggle } from '@/components/shared/theme-toggle'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { useAuth } from '@/providers/auth-provider.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'

export function AppHeader() {
	const { user, logout } = useAuth()
	const { activeLocation, locations, isConsolidated, switchLocation, isSwitching } =
		useLocationContext()

	const initials = user?.name
		? user.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.slice(0, 2)
				.toUpperCase()
		: '??'

	const displayLocation = isConsolidated ? 'Semua Lokasi' : (activeLocation?.name ?? 'Semua Lokasi')

	return (
		<header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mx-2 h-6" />

			{/* Location switcher */}
			<DropdownMenu>
				<DropdownMenuTrigger
					className="inline-flex h-7 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-sm font-normal hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
					disabled={isSwitching}
				>
					<MapPinIcon className="size-4 text-muted-foreground" />
					<span>{displayLocation}</span>
					<ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" sideOffset={8}>
					<DropdownMenuItem onClick={() => switchLocation(null)}>
						<span className="flex-1">Semua Lokasi</span>
						{isConsolidated && <CheckIcon className="ml-2 size-3.5" />}
					</DropdownMenuItem>
					{locations.length > 0 && <DropdownMenuSeparator />}
					{locations.map((loc) => (
						<DropdownMenuItem key={loc.id} onClick={() => switchLocation(loc.id)}>
							<span className="flex-1">{loc.name}</span>
							{activeLocation?.id === loc.id && <CheckIcon className="ml-2 size-3.5" />}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<div className="flex-1" />

			<ThemeToggle />

			{/* User menu */}
			<DropdownMenu>
				<DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent">
					<Avatar size="sm">
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<span className="hidden md:inline">{user?.name ?? 'User'}</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" sideOffset={8}>
					<DropdownMenuItem>
						<UserIcon className="mr-2 size-4" />
						Profile
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => logout()}>
						<LogOutIcon className="mr-2 size-4" />
						Logout
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	)
}
