import { ChevronsUpDownIcon, KeyRoundIcon, LogOutIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useAppState } from '@/hooks/use-app-state'
import { useUser } from '@/hooks/use-user'

import { UserProfilePasswordDialog } from './user-profile-password-dialog'

export function UserSection() {
	const { isMobile } = useSidebar()
	const user = useUser()
	const { clearToken } = useAppState()

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
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
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
						<DropdownMenuItem onSelect={() => UserProfilePasswordDialog.call()} className="gap-2">
							<KeyRoundIcon className="size-4" />
							Ubah Password
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={() => {
								clearToken()
							}}
							className="gap-2 text-destructive focus:bg-destructive/10"
						>
							<LogOutIcon className="size-4" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
