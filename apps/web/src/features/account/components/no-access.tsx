import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'

import { LockKeyholeIcon, LogOutIcon, UserIcon } from 'lucide-react'

import { Logo } from '@/components/brand'
import { IconTile } from '@/components/reui/icon-tile.tsx'

import { Button } from '@/components/ui/button'

import { useAuth } from '@/providers/auth-provider.tsx'

/** Bare chrome for users with nothing to navigate: no sidebar, no location switcher. */
export function NoAccessLayout({ children }: { children: ReactNode }) {
	const { logout } = useAuth()

	return (
		<div className="flex min-h-svh flex-col bg-background text-foreground">
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
				<Link to="/" aria-label="Ikki ERP">
					<Logo />
				</Link>
				<div className="flex-1" />
				<Button variant="ghost" size="sm" render={<Link to="/account" />}>
					<UserIcon className="size-4" />
					My account
				</Button>
				<Button variant="ghost" size="sm" onClick={() => void logout()}>
					<LogOutIcon className="size-4" />
					Logout
				</Button>
			</header>
			<main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
		</div>
	)
}

export function NoAccessScreen() {
	const { user, logout } = useAuth()

	return (
		<div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
			<IconTile variant="soft" size="lg" className="mb-4">
				<LockKeyholeIcon />
			</IconTile>
			<h1 className="font-heading text-lg font-semibold tracking-tight">No access yet</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				Your account has not been given access to any location or feature. Contact an administrator
				to be assigned a role.
			</p>
			{user && (
				<p className="mt-4 text-sm">
					Signed in as <span className="font-medium">{user.name}</span>{' '}
					<span className="font-mono text-muted-foreground">({user.username})</span>
				</p>
			)}
			<div className="mt-6 flex flex-wrap justify-center gap-2">
				<Button render={<Link to="/account" />}>My account</Button>
				<Button variant="outline" onClick={() => void logout()}>
					Logout
				</Button>
			</div>
		</div>
	)
}
