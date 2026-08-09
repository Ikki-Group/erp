import { useState } from 'react'

import { AlertTriangleIcon } from 'lucide-react'
import { createCallable } from 'react-call'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface ConfirmProps {
	title: string
	description: string
	confirmLabel?: string
	cancelLabel?: string
	variant?: 'default' | 'destructive'
	/**
	 * Optional async action. When provided, the dialog stays open with a loading
	 * spinner until the promise resolves. If it throws, the dialog remains open
	 * so the user can retry or cancel.
	 */
	onConfirm?: () => Promise<void>
}

type ConfirmResponse = boolean

const UNMOUNTING_DELAY = 150

export const Confirm = createCallable<ConfirmProps, ConfirmResponse>(
	({
		call,
		title,
		description,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		variant = 'default',
		onConfirm,
	}) => {
		const [loading, setLoading] = useState(false)
		const [error, setError] = useState<string | null>(null)

		const handleConfirm = async () => {
			if (!onConfirm) {
				call.end(true)
				return
			}

			setLoading(true)
			setError(null)
			try {
				await onConfirm()
				call.end(true)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'An error occurred. Please try again.')
				setLoading(false)
			}
		}

		return (
			<Dialog
				open={!call.ended}
				onOpenChange={(open) => {
					if (!open && !loading) call.end(false)
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
					{error && (
						<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
							{error}
						</p>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => call.end(false)} disabled={loading}>
							{cancelLabel}
						</Button>
						<Button
							variant={variant === 'destructive' ? 'destructive' : 'default'}
							className={cn(
								variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90',
							)}
							disabled={loading}
							onClick={handleConfirm}
						>
							{loading && <Spinner className="mr-1.5 size-3.5" />}
							{confirmLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		)
	},
	UNMOUNTING_DELAY,
)

/**
 * Imperative confirm dialog. Returns `true` if confirmed, `false` if cancelled.
 *
 * Supports async actions — pass `onConfirm` to keep the dialog open with a
 * loading spinner until the promise resolves. If the promise rejects, an error
 * message is shown and the user can retry or cancel.
 *
 * @example
 * ```tsx
 * // Simple (no async)
 * const accepted = await confirm({ title: 'Delete?', description: '...' })
 *
 * // With async action
 * const accepted = await confirm({
 *   title: 'Delete material?',
 *   description: 'This cannot be undone.',
 *   confirmLabel: 'Delete',
 *   variant: 'destructive',
 *   onConfirm: async () => {
 *     await api.deleteMaterial(id)
 *   },
 * })
 * ```
 */
export const confirm = Confirm.call
