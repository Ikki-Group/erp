import { useState, useCallback, useEffect } from 'react'

import { useMutation } from '@tanstack/react-query'

import { AlertCircleIcon, AlertTriangleIcon, InfoIcon, Loader2Icon } from 'lucide-react'
import { createCallable } from 'react-call'

import { cn } from '@/lib/utils'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

type ConfirmVariant = 'destructive' | 'warning' | 'default'

interface ConfirmDialogProps {
	title: string
	description?: string
	variant?: ConfirmVariant
	confirmLabel?: string
	cancelLabel?: string
	onConfirm: () => Promise<void> | void
	confirmValidationText?: string
}

interface VariantConfig {
	actionClass: string
	icon: React.ReactNode
	iconClass: string
}

// Base styles for consistent design
const baseActionClass = 'transition-colors shadow-sm'
const baseIconClass = 'rounded-full transition-transform'

// Variant configurations with DRY principles
const variantConfig: Record<ConfirmVariant, VariantConfig> = {
	destructive: {
		actionClass: cn(baseActionClass, 'bg-destructive text-white hover:bg-destructive/90'),
		icon: <AlertTriangleIcon className="size-5" />,
		iconClass: cn(baseIconClass, 'text-destructive bg-destructive/10 ring-destructive/20 ring-1'),
	},
	warning: {
		actionClass: cn(baseActionClass, 'bg-warning text-warning-foreground hover:bg-warning/90'),
		icon: <AlertCircleIcon className="size-5" />,
		iconClass: cn(baseIconClass, 'text-warning bg-warning/10 ring-warning/20 ring-1'),
	},
	default: {
		actionClass: cn(baseActionClass, 'bg-primary text-primary-foreground hover:bg-primary/90'),
		icon: <InfoIcon className="size-5" />,
		iconClass: cn(baseIconClass, 'text-primary bg-primary/10 ring-primary/20 ring-1'),
	},
}

/**
 * A reusable confirmation dialog that can be called imperatively.
 * Powered by `react-call` and `shadcn/ui` AlertDialog.
 *
 * Features:
 * - Modern, compact ERP-friendly design
 * - Keyboard shortcuts (Escape to cancel, Enter to confirm)
 * - Optional validation input for destructive actions
 * - Loading states with visual feedback
 */
export const ConfirmDialog = createCallable<ConfirmDialogProps, boolean>(
	({
		call,
		title,
		description,
		variant = 'destructive',
		confirmLabel = 'Lanjutkan',
		cancelLabel = 'Batal',
		onConfirm,
		confirmValidationText,
	}) => {
		const [validationInput, setValidationInput] = useState('')
		const config = variantConfig[variant]

		const confirmMutation = useMutation({
			mutationFn: async () => onConfirm(),
			onSuccess: () => call.end(true),
			onError: (error) => {
				console.error('[ConfirmDialog] Action failed:', error)
			},
		})

		// Clear validation input when dialog closes
		useEffect(() => {
			if (call.ended) {
				setValidationInput('')
			}
		}, [call.ended])

		const isConfirmDisabled = useCallback(() => {
			return (
				confirmMutation.isPending ||
				(confirmValidationText !== undefined && validationInput !== confirmValidationText)
			)
		}, [confirmMutation.isPending, confirmValidationText, validationInput])

		const handleConfirm = useCallback(
			(e: React.MouseEvent | React.KeyboardEvent) => {
				e.preventDefault()
				if (!isConfirmDisabled()) {
					confirmMutation.mutate()
				}
			},
			[confirmMutation, isConfirmDisabled],
		)

		const handleCancel = useCallback(() => {
			if (!confirmMutation.isPending) {
				call.end(false)
			}
		}, [call, confirmMutation.isPending])

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent) => {
				if (e.key === 'Escape') {
					handleCancel()
				} else if (e.key === 'Enter' && !isConfirmDisabled()) {
					handleConfirm(e)
				}
			},
			[handleCancel, handleConfirm, isConfirmDisabled],
		)

		return (
			<AlertDialog
				open={!call.ended}
				onOpenChange={(open) => {
					if (!open && !confirmMutation.isPending) {
						handleCancel()
					}
				}}
			>
				<AlertDialogContent className="max-w-sm gap-4" onKeyDown={handleKeyDown}>
					<AlertDialogHeader className="gap-3">
						<AlertDialogMedia className={config.iconClass}>{config.icon}</AlertDialogMedia>
						<div className="flex flex-col gap-1.5">
							<AlertDialogTitle className="text-base font-semibold tracking-tight">
								{title}
							</AlertDialogTitle>
							{description && (
								<AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground/90 whitespace-pre-wrap">
									{description}
								</AlertDialogDescription>
							)}
						</div>
					</AlertDialogHeader>

					{confirmValidationText && (
						<>
							<Separator />
							<div className="flex flex-col gap-2">
								<p className="text-xs text-muted-foreground leading-snug">
									Type{' '}
									<span className="font-semibold text-foreground">{confirmValidationText}</span> to
									confirm:
								</p>
								<Input
									autoFocus
									value={validationInput}
									onChange={(e) => setValidationInput(e.target.value)}
									placeholder={confirmValidationText}
									className="h-9"
								/>
							</div>
						</>
					)}

					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel
							disabled={confirmMutation.isPending}
							onClick={handleCancel}
							className="font-medium"
						>
							{cancelLabel}
						</AlertDialogCancel>
						<AlertDialogAction
							className={cn('min-w-[90px] font-semibold', config.actionClass)}
							onClick={handleConfirm}
							disabled={isConfirmDisabled()}
						>
							{confirmMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
							{confirmMutation.isPending ? 'Processing...' : confirmLabel}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		)
	},
	200,
)
