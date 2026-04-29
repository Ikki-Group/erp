import * as React from 'react'
import type { ReactNode } from 'react'

import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import type { VariantProps } from 'class-variance-authority'

/* -------------------------------------------------------------------------- */
/*  EmptyState                                                                */
/* -------------------------------------------------------------------------- */

const emptyStateVariants = cva('flex flex-col items-center justify-center text-center', {
	variants: {
		size: {
			sm: 'py-8 gap-3',
			md: 'py-12 gap-4',
			lg: 'py-16 gap-6',
			xl: 'py-24 gap-8',
		},
	},
	defaultVariants: { size: 'md' },
})

export interface EmptyStateProps
	extends React.ComponentProps<'div'>, VariantProps<typeof emptyStateVariants> {
	icon?: ReactNode
	title: string
	description?: string
	action?: ReactNode
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	size,
	className,
	...props
}: EmptyStateProps) {
	return (
		<div className={cn(emptyStateVariants({ size }), className)} {...props}>
			{icon && <div className="text-muted-foreground/40">{icon}</div>}
			<div className="flex flex-col gap-2 max-w-md">
				<h3 className="text-lg font-semibold text-foreground/90">{title}</h3>
				{description && (
					<p className="text-sm text-muted-foreground/70 leading-relaxed">{description}</p>
				)}
			</div>
			{action && <div className="flex gap-2">{action}</div>}
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/*  LoadingState                                                              */
/* -------------------------------------------------------------------------- */

const loadingStateVariants = cva('flex flex-col items-center justify-center', {
	variants: {
		size: {
			sm: 'py-8',
			md: 'py-12',
			lg: 'py-16',
			xl: 'py-24',
		},
	},
	defaultVariants: { size: 'md' },
})

export interface LoadingStateProps
	extends React.ComponentProps<'div'>, VariantProps<typeof loadingStateVariants> {
	message?: string
}

export function LoadingState({ message, size, className, ...props }: LoadingStateProps) {
	return (
		<div className={cn(loadingStateVariants({ size }), className)} {...props}>
			<div className="flex flex-col items-center gap-3">
				<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				{message && <p className="text-sm text-muted-foreground/70">{message}</p>}
			</div>
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/*  ErrorState                                                                */
/* -------------------------------------------------------------------------- */

const errorStateVariants = cva('flex flex-col items-center justify-center text-center', {
	variants: {
		size: {
			sm: 'py-8 gap-3',
			md: 'py-12 gap-4',
			lg: 'py-16 gap-6',
			xl: 'py-24 gap-8',
		},
	},
	defaultVariants: { size: 'md' },
})

export interface ErrorStateProps
	extends React.ComponentProps<'div'>, VariantProps<typeof errorStateVariants> {
	title?: string
	message?: string
	onRetry?: () => void
	retryText?: string
}

export function ErrorState({
	title = 'Terjadi Kesalahan',
	message,
	onRetry,
	retryText = 'Coba Lagi',
	size,
	className,
	...props
}: ErrorStateProps) {
	return (
		<div className={cn(errorStateVariants({ size }), className)} {...props}>
			<div className="flex flex-col items-center gap-4 max-w-md">
				<div className="rounded-full bg-destructive/10 p-4">
					<div className="text-destructive">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={32}
							height={32}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="m15 9-6 6" />
							<path d="m9 9 6 6" />
						</svg>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<h3 className="text-lg font-semibold text-foreground/90">{title}</h3>
					{message && <p className="text-sm text-muted-foreground/70 leading-relaxed">{message}</p>}
				</div>
				{onRetry && (
					<Button variant="outline" size="sm" onClick={onRetry}>
						{retryText}
					</Button>
				)}
			</div>
		</div>
	)
}

/* -------------------------------------------------------------------------- */
/*  NotFoundState                                                             */
/* -------------------------------------------------------------------------- */

const notFoundStateVariants = cva('flex flex-col items-center justify-center text-center', {
	variants: {
		size: {
			sm: 'py-8 gap-3',
			md: 'py-12 gap-4',
			lg: 'py-16 gap-6',
			xl: 'py-24 gap-8',
		},
	},
	defaultVariants: { size: 'md' },
})

export interface NotFoundStateProps
	extends React.ComponentProps<'div'>, VariantProps<typeof notFoundStateVariants> {
	title?: string
	description?: string
	action?: ReactNode
}

export function NotFoundState({
	title = 'Tidak Ditemukan',
	description = 'Data yang Anda cari tidak tersedia atau telah dihapus.',
	action,
	size,
	className,
	...props
}: NotFoundStateProps) {
	return (
		<div className={cn(notFoundStateVariants({ size }), className)} {...props}>
			<div className="flex flex-col items-center gap-4 max-w-md">
				<div className="rounded-full bg-muted/50 p-4">
					<div className="text-muted-foreground/60">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width={32}
							height={32}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.3-4.3" />
						</svg>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<h3 className="text-lg font-semibold text-foreground/90">{title}</h3>
					{description && (
						<p className="text-sm text-muted-foreground/70 leading-relaxed">{description}</p>
					)}
				</div>
				{action && <div className="flex gap-2">{action}</div>}
			</div>
		</div>
	)
}
