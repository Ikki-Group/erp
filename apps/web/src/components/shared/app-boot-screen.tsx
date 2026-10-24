import { StoreIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Spinner } from '@/components/ui/spinner'

export interface AppBootScreenProps {
	className?: string
	/** Shown beneath the brand mark while the app verifies the session. */
	label?: string
}

/**
 * Full-page boot screen shown while `_authenticated`'s `beforeLoad` performs
 * its one-time, cold-boot session check (see `routes/_authenticated.tsx`).
 * Only renders on a hard refresh / first load — once `/auth/me` has resolved
 * once, it's cached and this never shows again for the rest of the SPA
 * session. Exists purely so cold boot shows an intentional, on-brand loading
 * state instead of a blank flash while that first request is in flight.
 */
export function AppBootScreen({
	className,
	label = 'Menyiapkan ruang kerja Anda…',
}: AppBootScreenProps) {
	return (
		<div
			className={cn(
				'flex min-h-svh flex-col items-center justify-center gap-4 bg-background text-foreground',
				className,
			)}
		>
			<div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
				<StoreIcon aria-hidden="true" className="size-5" />
			</div>
			<Spinner className="size-5 text-muted-foreground" />
			<p className="text-sm text-muted-foreground">{label}</p>
		</div>
	)
}
