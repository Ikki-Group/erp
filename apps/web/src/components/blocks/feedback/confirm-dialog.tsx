import React, { useState } from 'react'

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
	actionClass?: string
	icon: React.ReactNode
	iconClass: string
}

const variantConfig: Record<ConfirmVariant, VariantConfig> = {
	destructive: {
		actionClass: 'bg-destructive text-white hover:bg-destructive/90 transition-colors shadow-sm',
		icon: <AlertTriangleIcon className="size-5" />,
		iconClass: 'text-destructive bg-destructive/10 ring-destructive/20 ring-1',
	},
	warning: {
		actionClass:
			'bg-warning text-warning-foreground hover:bg-warning/90 transition-colors shadow-sm',
		icon: <AlertCircleIcon className="size-5" />,
		iconClass: 'text-warning bg-warning/10 ring-warning/20 ring-1',
	},
	default: {
		actionClass: 'bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm',
		icon: <InfoIcon className="size-5" />,
		iconClass: 'text-primary bg-primary/10 ring-primary/20 ring-1',
	},
}

/**
 * A reusable confirmation dialog that can be called imperatively.
 * Powered by `react-call` and `shadcn/ui` AlertDialog.
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

		const isConfirmDisabled =
			confirmMutation.isPending ||
			(confirmValidationText !== undefined && validationInput !== confirmValidationText)

		const handleConfirm = (e: React.MouseEvent | React.KeyboardEvent) => {
			e.preventDefault()
			confirmMutation.mutate()
		}

		const handleCancel = () => {
			if (!confirmMutation.isPending) {
				call.end(false)
			}
		}

		return (
			<AlertDialog
				open={!call.ended}
				onOpenChange={(open) => {
					if (!open && !confirmMutation.isPending) {
						call.end(false)
					}
				}}
			>
				<AlertDialogContent className="max-w-[400px]">
					<AlertDialogHeader>
						<AlertDialogMedia className={cn('rounded-full transition-transform', config.iconClass)}>
							{config.icon}
						</AlertDialogMedia>
						<div className="flex flex-col gap-1">
							<AlertDialogTitle className="text-lg font-semibold tracking-tight">
								{title}
							</AlertDialogTitle>
							{description && (
								<AlertDialogDescription className="text-muted-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
									{description}
								</AlertDialogDescription>
							)}
						</div>
					</AlertDialogHeader>

					{confirmValidationText && (
						<>
							<Separator />
							<div className="flex flex-col gap-2">
								<p className="text-muted-foreground text-[0.8rem] leading-snug">
									Silakan ketik{' '}
									<span className="font-bold text-foreground">{confirmValidationText}</span> untuk
									mengonfirmasi:
								</p>
								<Input
									autoFocus
									value={validationInput}
									onChange={(e) => setValidationInput(e.target.value)}
									placeholder={confirmValidationText}
									className="h-8 bg-background focus-visible:ring-destructive/30"
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !isConfirmDisabled) {
											handleConfirm(e)
										}
									}}
								/>
							</div>
						</>
					)}

					<AlertDialogFooter className="mt-2">
						<AlertDialogCancel
							disabled={confirmMutation.isPending}
							onClick={handleCancel}
							variant="ghost"
							className="font-medium"
						>
							{cancelLabel}
						</AlertDialogCancel>
						<AlertDialogAction
							className={cn('min-w-[100px] font-semibold', config.actionClass)}
							onClick={handleConfirm}
							disabled={isConfirmDisabled}
						>
							{confirmMutation.isPending ? (
								<Loader2Icon className="mr-2 size-4 animate-spin" />
							) : null}
							{confirmLabel}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		)
	},
	200,
)
