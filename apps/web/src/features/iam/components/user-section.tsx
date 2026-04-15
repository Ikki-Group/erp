import { useCallback } from 'react'

import { useRouter } from '@tanstack/react-router'

import { ChevronsUpDownIcon, KeyRoundIcon, LogOutIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar'

import { UserProfilePasswordDialog } from './user-profile-password-dialog'
import { useAppState } from '@/hooks/use-app-state'
import { useUser } from '@/hooks/use-user'

export function UserSection() {
	const router = useRouter()
	const user = useUser()
	const { isMobile } = useSidebar()
	const { clearToken } = useAppState()

	const logout = useCallback(() => {
		clearToken()
		router.invalidate()
		router.navigate({ to: '/login', replace: true })
	}, [clearToken, router])

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarFallback className="rounded-lg">
								{user.username.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">{user.fullname}</span>
							<span className="truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDownIcon className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4}>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar className="h-8 w-8 rounded-lg">
										<AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
											{user.username.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 leading-tight">
										<span className="truncate font-semibold">{user.fullname}</span>
										<span className="truncate text-xs text-muted-foreground">@{user.username}</span>
									</div>
								</div>
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						{/* oxlint-disable-next-line typescript/no-misused-promises */}
						<DropdownMenuItem onSelect={() => UserProfilePasswordDialog.call()}>
							<KeyRoundIcon className="size-4" />
							Ubah Password
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							render={
								<Button
									className="w-full items-start hover:bg-destructive/30! text-left justify-start"
									variant="ghost"
									size="sm"
									onClick={logout}
								/>
							}
						>
							<LogOutIcon />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
