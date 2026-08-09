import type { ReactNode } from 'react'
import { AlertCircleIcon, CheckCircleIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { cn } from '@/lib/utils'

const icons = {
	error: AlertCircleIcon,
	success: CheckCircleIcon,
	info: InfoIcon,
	warning: AlertTriangleIcon,
} as const

interface InlineAlertProps {
	variant: 'error' | 'success' | 'info' | 'warning'
	title?: string
	children: ReactNode
	className?: string
}

export function InlineAlert({ variant, title, children, className }: InlineAlertProps) {
	const Icon = icons[variant]

	return (
		<Alert
			variant={variant === 'error' ? 'destructive' : 'default'}
			className={cn(
				{
					'border-success/30 text-success-foreground': variant === 'success',
					'border-warning/30 text-warning-foreground': variant === 'warning',
					'border-info/30 text-info-foreground': variant === 'info',
				},
				className,
			)}
		>
			<Icon />
			{title && <AlertTitle>{title}</AlertTitle>}
			<AlertDescription>{children}</AlertDescription>
		</Alert>
	)
}
