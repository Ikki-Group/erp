import { useCallback, useRef, useState } from 'react'

import { AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react'
import { createCallable } from 'react-call'

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

/** Must cover the dialog's own close animation (150ms) so it finishes before unmount. */
const UNMOUNTING_DELAY = 300

/** How long the success state is shown before the dialog auto-closes. */
const SUCCESS_DISPLAY_DURATION = 600

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
		const [success, setSuccess] = useState(false)
		const isClosingRef = useRef(false)

		const close = useCallback(
			(result: boolean) => {
				isClosingRef.current = true
				call.end(result)
			},
			[call],
		)

		const handleConfirm = useCallback(async () => {
			if (!onConfirm) {
				close(true)
				return
			}

			setLoading(true)
			setError(null)
			try {
				await onConfirm()
				setSuccess(true)
				setLoading(false)
				setTimeout(() => close(true), SUCCESS_DISPLAY_DURATION)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'An error occurred. Please try again.')
				setLoading(false)
			}
		}, [onConfirm, close])

		const handleCancel = useCallback(() => {
			if (!loading && !isClosingRef.current && !success) {
				close(false)
			}
		}, [loading, success, close])

		const handleOpenChange = useCallback(
			(open: boolean) => {
				if (!open && !loading && !isClosingRef.current && !success && !call.ended) {
					close(false)
				}
			},
			[loading, success, call.ended, close],
		)

		const showFooter = !success

		return (
			<Dialog open={!call.ended} onOpenChange={handleOpenChange}>
				<DialogContent showCloseButton={false}>
					<DialogHeader className={variant === 'destructive' ? 'bg-destructive/5' : ''}>
						{!success && variant === 'destructive' && (
							<div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/8 text-destructive">
								<AlertTriangleIcon className="size-5 stroke-[2.5]" />
							</div>
						)}
						{success && (
							<div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-success/20 bg-success/8 text-success animate-pulse">
								<CheckCircle2Icon className="size-5" />
							</div>
						)}
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>

					{error && (
						<div
							role="alert"
							className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-medium text-destructive"
						>
							{error}
						</div>
					)}

					{showFooter && (
						<DialogFooter>
							<Button variant="outline" onClick={handleCancel} disabled={loading}>
								{cancelLabel}
							</Button>
							<Button
								variant={variant === 'destructive' ? 'destructive' : 'default'}
								disabled={loading}
								onClick={handleConfirm}
							>
								{loading && <Spinner className="mr-1.5 size-3.5" />}
								{error ? 'Try Again' : confirmLabel}
							</Button>
						</DialogFooter>
					)}

					{success && (
						<DialogFooter>
							<Button
								onClick={() => close(true)}
								className="w-full animate-in fade-in-0 zoom-in-95 duration-200 sm:w-auto"
							>
								Done
							</Button>
						</DialogFooter>
					)}
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
