import type { ReactNode } from 'react'
import { InfoIcon, CircleCheckIcon, AlertTriangleIcon, AlertCircleIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const variants = {
	tip: {
		icon: InfoIcon,
		border: 'border-info/30',
		bg: 'bg-info/5',
		label: 'text-info-foreground',
		iconColor: 'text-info',
	},
	success: {
		icon: CircleCheckIcon,
		border: 'border-success/30',
		bg: 'bg-success/5',
		label: 'text-success-foreground',
		iconColor: 'text-success',
	},
	warning: {
		icon: AlertTriangleIcon,
		border: 'border-warning/30',
		bg: 'bg-warning/5',
		label: 'text-warning-foreground',
		iconColor: 'text-warning',
	},
	error: {
		icon: AlertCircleIcon,
		border: 'border-destructive/30',
		bg: 'bg-destructive/5',
		label: 'text-destructive-foreground',
		iconColor: 'text-destructive',
	},
} as const

export type InlineTipVariant = keyof typeof variants

export interface InlineTipProps {
	variant?: InlineTipVariant
	/** Bold label shown before the content. Defaults to variant name. */
	label?: string
	children: ReactNode
	className?: string
}

/**
 * Inline contextual tip/note (Medusa-style).
 * Use for field-level guidance, warnings, or contextual information.
 *
 * @example
 * ```tsx
 * <InlineTip>Stock is calculated per-location. Transfer to move between stores.</InlineTip>
 * <InlineTip variant="warning">This action cannot be undone.</InlineTip>
 * ```
 */
export function InlineTip({ variant = 'tip', label, children, className }: InlineTipProps) {
	const config = variants[variant]
	const Icon = config.icon
	const displayLabel = label ?? variant.charAt(0).toUpperCase() + variant.slice(1)

	return (
		<div
			className={cn(
				'flex gap-2.5 rounded-md border px-3 py-2.5',
				config.border,
				config.bg,
				className,
			)}
		>
			<Icon className={cn('mt-0.5 size-4 shrink-0', config.iconColor)} />
			<div className="text-xs leading-relaxed">
				<span className={cn('font-semibold', config.label)}>{displayLabel}:</span>{' '}
				<span className="text-foreground">{children}</span>
			</div>
		</div>
	)
}
