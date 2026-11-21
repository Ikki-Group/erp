import { Link } from '@tanstack/react-router'

import {
	CheckIcon,
	ChevronsUpDownIcon,
	LogOutIcon,
	MapPinIcon,
	MonitorIcon,
	MoonIcon,
	SunIcon,
	UserIcon,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { useAuth } from '@/providers/auth-provider.tsx'
import { useLocationContext } from '@/providers/location-provider.tsx'
import { useTheme } from '@/providers/theme-provider'

export function AppHeader() {
	const { user, logout } = useAuth()
	const { theme, setTheme } = useTheme()
	const { activeLocation, locations, isConsolidated, switchLocation } = useLocationContext()

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
		<header className="z-10 flex h-14 min-w-0 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
			<SidebarTrigger size="icon-lg" className="-ml-1" />
			<Separator orientation="vertical" className="mx-2" aria-hidden="true" />

			{/* Location switcher with accessible indicator */}
			<DropdownMenu>
				<DropdownMenuTrigger className="inline-flex min-h-9 w-56 min-w-0 max-w-[min(18rem,calc(100vw-9rem))] items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-sm font-normal hover:bg-accent disabled:pointer-events-none disabled:opacity-50">
					<MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
					<span className="flex-1 truncate">{displayLocation}</span>
					<ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" sideOffset={8}>
					<DropdownMenuItem onClick={() => switchLocation(null)}>
						<span className="flex-1">Semua Lokasi</span>
						{isConsolidated && <CheckIcon className="ml-2" />}
					</DropdownMenuItem>
					{locations.length > 0 && <DropdownMenuSeparator />}
					{locations.map((loc) => (
						<DropdownMenuItem key={loc.id} onClick={() => switchLocation(loc.id)}>
							<span className="flex-1">{loc.name}</span>
							{activeLocation?.id === loc.id && <CheckIcon className="ml-2" />}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Screen reader announcement for location changes */}
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				Lokasi aktif: {displayLocation}
			</div>

			<div className="flex-1" />

			{/* User menu */}
			<DropdownMenu>
				<DropdownMenuTrigger
					className="flex min-h-9 min-w-9 items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent"
					aria-label={`Buka menu pengguna untuk ${user?.name ?? 'Pengguna'}`}
				>
					<Avatar size="sm">
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<span className="hidden md:inline">{user?.name ?? 'Pengguna'}</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" sideOffset={8}>
					<DropdownMenuRadioGroup
						value={theme ?? 'system'}
						onValueChange={(value) => setTheme(value)}
					>
						<DropdownMenuLabel>Tema</DropdownMenuLabel>
						<DropdownMenuRadioItem value="light">
							<SunIcon />
							Terang
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="dark">
							<MoonIcon />
							Gelap
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="system">
							<MonitorIcon />
							Sistem
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem render={<Link to="/account" />}>
						<UserIcon />
						Profil
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => logout()}>
						<LogOutIcon />
						Keluar
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</header>
	)
}
