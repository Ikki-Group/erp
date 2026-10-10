import { useCallback, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'

export interface ConfirmSummaryRow {
	label: string
	/** Numbers/money should already be formatted (e.g. `<CurrencyDisplay />`). */
	value: ReactNode
}

export interface ConfirmProps {
	title: string
	description: ReactNode
	confirmLabel?: string
	cancelLabel?: string
	/** `destructive` = irreversible / data-changing: warning icon + destructive confirm button. */
	tone?: 'default' | 'destructive'
	/** @deprecated use `tone`. */
	variant?: 'default' | 'destructive'
	/** What the action will touch, shown as a small label/value list above the buttons. */
	summary?: ConfirmSummaryRow[]
	/** Typed confirmation: the confirm button stays disabled until the user types this exactly. */
	requireText?: string
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
		tone,
		variant,
		summary,
		requireText,
		onConfirm,
	}) => {
		const [loading, setLoading] = useState(false)
		const [error, setError] = useState<string | null>(null)
		const [success, setSuccess] = useState(false)
		const [typed, setTyped] = useState('')
		const isClosingRef = useRef(false)
		const inputId = useId()
		const destructive = (tone ?? variant) === 'destructive'
		const textMatches = requireText === undefined || typed === requireText

		const close = useCallback(
			(result: boolean) => {
				isClosingRef.current = true
				call.end(result)
			},
			[call],
		)

		const handleConfirm = useCallback(async () => {
			if (!textMatches) return
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
		}, [onConfirm, close, textMatches])

		const handleCancel = useCallback(() => {
			if (!loading && !isClosingRef.current && !success) close(false)
		}, [loading, success, close])

		const handleOpenChange = useCallback(
			(open: boolean) => {
				if (!open && !loading && !isClosingRef.current && !success && !call.ended) {
					close(false)
				}
			},
			[loading, success, call.ended, close],
		)

		return (
			<Dialog open={!call.ended} onOpenChange={handleOpenChange}>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						{!success && destructive && (
							<div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
								<AlertTriangleIcon className="size-4.5" />
							</div>
						)}
						{success && (
							<div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
								<CheckCircle2Icon className="size-4.5" />
							</div>
						)}
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>

					{((summary && summary.length > 0) ||
						(requireText !== undefined && !success) ||
						error) && (
						<div className="space-y-3 py-4">
							{summary && summary.length > 0 && (
								<dl className="divide-y rounded-md border text-sm">
									{summary.map((row) => (
										<div
											key={row.label}
											className="flex items-baseline justify-between gap-4 px-3 py-2"
										>
											<dt className="shrink-0 text-xs text-muted-foreground">{row.label}</dt>
											<dd className="min-w-0 text-right font-medium">{row.value}</dd>
										</div>
									))}
								</dl>
							)}

							{requireText !== undefined && !success && (
								<div className="space-y-1.5">
									<Label htmlFor={inputId}>
										<span>
											Type{' '}
											<span className="font-mono font-semibold text-foreground">{requireText}</span>{' '}
											to confirm
										</span>
									</Label>
									<Input
										id={inputId}
										value={typed}
										onChange={(e) => setTyped(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') void handleConfirm()
										}}
										placeholder={requireText}
										autoComplete="off"
										autoFocus
										disabled={loading}
									/>
								</div>
							)}

							{error && (
								<div
									role="alert"
									className="animate-in slide-in-from-top-2 duration-200 rounded-md bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive"
								>
									<div className="mb-2">{error}</div>
									<Button size="sm" variant="outline" onClick={() => void handleConfirm()}>
										Try Again
									</Button>
								</div>
							)}
						</div>
					)}

					{!error && !success && (
						<DialogFooter>
							<Button
								variant="outline"
								onClick={handleCancel}
								disabled={loading}
								className="pointer-coarse:h-10"
							>
								{cancelLabel}
							</Button>
							<Button
								variant={destructive ? 'destructive' : 'default'}
								disabled={loading || !textMatches}
								onClick={() => void handleConfirm()}
								className="pointer-coarse:h-10"
							>
								{loading && <Spinner className="mr-1.5 size-3.5" />}
								{confirmLabel}
							</Button>
						</DialogFooter>
					)}

					{success && (
						<DialogFooter>
							<Button onClick={() => close(true)} className="w-full sm:w-auto pointer-coarse:h-10">
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
 * - `onConfirm` (async) keeps the dialog open with a spinner; a rejection shows
 *   the error with a retry.
 * - `summary` lists what the action touches (label/value rows; values may be
 *   nodes like `<CurrencyDisplay />`). Use it for every stock- or money-moving action.
 * - `tone: 'destructive'` marks irreversible actions.
 * - `requireText` gates the confirm button behind typing a word (e.g. a name).
 *
 * @example
 * ```tsx
 * await confirm({
 *   title: 'Konfirmasi penerimaan?',
 *   description: 'Stok akan bertambah. Tindakan ini tidak dapat dibatalkan.',
 *   tone: 'destructive',
 *   summary: [
 *     { label: 'Lokasi', value: location.name },
 *     { label: 'Total', value: <CurrencyDisplay value={detail.totalValue} /> },
 *   ],
 *   onConfirm: () => api.confirm(id),
 * })
 * ```
 */
export const confirm = Confirm.call
