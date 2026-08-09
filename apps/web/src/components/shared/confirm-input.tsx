import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ConfirmInputProps {
	title: string
	description: string
	confirmWord: string
	confirmLabel?: string
	cancelLabel?: string
	inputLabel?: string
	inputPlaceholder?: string
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
	}) => {
		const [value, setValue] = useState('')
		const isMatch = value === confirmWord

		return (
			<Dialog
				open={!call.ended}
				onOpenChange={(open) => {
					if (!open) call.end(false)
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
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => call.end(false)}>
							{cancelLabel}
						</Button>
						<Button
							variant="destructive"
							className="bg-destructive text-white hover:bg-destructive/90"
							disabled={!isMatch}
							onClick={() => call.end(true)}
						>
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
 * Imperative confirm dialog that requires typing a confirmation word.
 * Returns `true` only when the user types the exact word and clicks confirm.
 *
 * @example
 * ```tsx
 * const accepted = await confirmInput({
 *   title: 'Delete "Coffee Beans"?',
 *   description: 'This action is permanent and cannot be undone.',
 *   confirmWord: 'Coffee Beans',
 *   confirmLabel: 'Delete permanently',
 * })
 * if (accepted) { // proceed }
 * ```
 */
export const confirmInput = ConfirmInput.call
