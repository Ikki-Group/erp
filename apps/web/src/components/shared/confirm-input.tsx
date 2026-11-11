import { useCallback, useId, useRef, useState } from 'react'

import { AlertTriangleIcon } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

interface ConfirmInputProps {
	title: string
	description: string
	confirmWord: string
	confirmLabel?: string
	cancelLabel?: string
	inputLabel?: string
	inputPlaceholder?: string
	/**
	 * Optional async action. When provided, the dialog stays open with a loading
	 * spinner until the promise resolves. If it throws, the dialog remains open.
	 */
	onConfirm?: () => Promise<void>
}

type ConfirmInputResponse = boolean

/** Must cover the dialog's own close animation (150ms) so it finishes before unmount. */
const UNMOUNTING_DELAY = 300

export const ConfirmInput = createCallable<ConfirmInputProps, ConfirmInputResponse>(
	({
		call,
		title,
		description,
		confirmWord,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		inputLabel,
		inputPlaceholder,
		onConfirm,
	}) => {
		const inputId = useId()
		const [value, setValue] = useState('')
		const [loading, setLoading] = useState(false)
		const [error, setError] = useState<string | null>(null)
		const isClosingRef = useRef(false)
		const isMatch = value === confirmWord

		const close = useCallback(
			(result: boolean) => {
				isClosingRef.current = true
				call.end(result)
			},
			[call],
		)

		const handleConfirm = async () => {
			if (!onConfirm) {
				close(true)
				return
			}

			setLoading(true)
			setError(null)
			try {
				await onConfirm()
				close(true)
			} catch (e) {
				setError(e instanceof Error ? e.message : 'An error occurred. Please try again.')
				setLoading(false)
			}
		}

		const handleCancel = useCallback(() => {
			if (!loading && !isClosingRef.current) {
				close(false)
			}
		}, [loading, close])

		const handleOpenChange = useCallback(
			(open: boolean) => {
				if (!open && !loading && !isClosingRef.current && !call.ended) {
					close(false)
				}
			},
			[loading, call.ended, close],
		)

		return (
			<Dialog open={!call.ended} onOpenChange={handleOpenChange}>
				<DialogContent showCloseButton={false}>
					<DialogHeader className="bg-destructive/5">
						<div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/8 text-destructive">
							<AlertTriangleIcon className="size-5 stroke-[2.5]" />
						</div>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-2">
						<Label htmlFor={inputId}>
							{inputLabel ?? (
								<>
									Type <span className="font-semibold text-foreground">{confirmWord}</span> to
									confirm
								</>
							)}
						</Label>
						<Input
							id={inputId}
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder={inputPlaceholder ?? confirmWord}
							autoComplete="off"
							autoFocus
							disabled={loading}
						/>
					</div>
					{error && (
						<div
							role="alert"
							className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-medium text-destructive"
						>
							{error}
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={handleCancel} disabled={loading}>
							{cancelLabel}
						</Button>
						<Button variant="destructive" disabled={!isMatch || loading} onClick={handleConfirm}>
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
 * Imperative confirm dialog requiring typed confirmation word.
 * Supports async actions with loading state.
 *
 * @example
 * ```tsx
 * const accepted = await confirmInput({
 *   title: 'Delete "Coffee Beans"?',
 *   description: 'This is permanent.',
 *   confirmWord: 'Coffee Beans',
 *   confirmLabel: 'Delete permanently',
 *   onConfirm: async () => {
 *     await api.deleteMaterial(id)
 *   },
 * })
 * ```
 */
export const confirmInput = ConfirmInput.call
