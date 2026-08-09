import { useState } from 'react'

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

const UNMOUNTING_DELAY = 150

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
		const [value, setValue] = useState('')
		const [loading, setLoading] = useState(false)
		const [error, setError] = useState<string | null>(null)
		const isMatch = value === confirmWord

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
						<div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
							<AlertTriangleIcon className="size-5" />
						</div>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>
					<div className="space-y-2 py-2">
						<Label htmlFor="confirm-input">
							{inputLabel ?? (
								<>
									Type <span className="font-semibold text-foreground">{confirmWord}</span> to
									confirm
								</>
							)}
						</Label>
						<Input
							id="confirm-input"
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder={inputPlaceholder ?? confirmWord}
							autoComplete="off"
							autoFocus
							disabled={loading}
						/>
					</div>
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
							variant="destructive"
							className="bg-destructive text-white hover:bg-destructive/90"
							disabled={!isMatch || loading}
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
