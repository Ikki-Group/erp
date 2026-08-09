import { createCallable } from 'react-call'
import { AlertTriangleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

import { cn } from '@/lib/utils'

interface ConfirmProps {
	title: string
	description: string
	confirmLabel?: string
	cancelLabel?: string
	variant?: 'default' | 'destructive'
}

type ConfirmResponse = boolean

const UNMOUNTING_DELAY = 150

export const Confirm = createCallable<ConfirmProps, ConfirmResponse>(
	({ call, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default' }) => (
		<Dialog
			open={!call.ended}
			onOpenChange={(open) => {
				if (!open) call.end(false)
			}}
		>
			<DialogContent>
				<DialogHeader>
					{variant === 'destructive' && (
						<div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
							<AlertTriangleIcon className="size-5" />
						</div>
					)}
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => call.end(false)}>
						{cancelLabel}
					</Button>
					<Button
						variant={variant === 'destructive' ? 'destructive' : 'default'}
						className={cn(
							variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90',
						)}
						onClick={() => call.end(true)}
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
	UNMOUNTING_DELAY,
)

/**
 * Imperative confirm dialog. Returns `true` if confirmed, `false` if cancelled.
 *
 * @example
 * ```tsx
 * const accepted = await confirm({
 *   title: 'Delete material?',
 *   description: 'This action cannot be undone.',
 *   confirmLabel: 'Delete',
 *   variant: 'destructive',
 * })
 * if (accepted) { /* proceed *\/ }
 * ```
 */
export const confirm = Confirm.call
