import type { ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const statusBadgeVariants = cva(
	'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
	{
		variants: {
			variant: {
				default: 'bg-secondary text-secondary-foreground',
				success: 'bg-success/10 text-success-foreground',
				warning: 'bg-warning/10 text-warning-foreground',
				destructive: 'bg-destructive/10 text-destructive-foreground',
				info: 'bg-info/10 text-info-foreground',
				outline: 'border border-border text-foreground',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

export type StatusBadgeVariant = NonNullable<VariantProps<typeof statusBadgeVariants>['variant']>

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
	children: ReactNode
	dot?: boolean
	className?: string
}

export function StatusBadge({ children, variant, dot = true, className }: StatusBadgeProps) {
	return (
		<span className={cn(statusBadgeVariants({ variant }), className)}>
			{dot && (
				<span
					className={cn('size-1.5 rounded-full', {
						'bg-secondary-foreground': variant === 'default' || !variant,
						'bg-success': variant === 'success',
						'bg-warning': variant === 'warning',
						'bg-destructive': variant === 'destructive',
						'bg-info': variant === 'info',
						'bg-foreground': variant === 'outline',
					})}
				/>
			)}
			{children}
		</span>
	)
}
