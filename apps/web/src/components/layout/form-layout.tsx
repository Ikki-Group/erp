import * as React from 'react'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import type { VariantProps } from 'class-variance-authority'

/* -------------------------------------------------------------------------- */
/*  FormLayout                                                                */
/* -------------------------------------------------------------------------- */

const formLayoutVariants = cva('flex flex-1 flex-col animate-enter', {
	variants: {
		gap: {
			sm: 'gap-4',
			md: 'gap-6',
			lg: 'gap-8',
			xl: 'gap-10',
		},
		padding: {
			none: 'p-0',
			sm: 'p-4',
			md: 'p-6',
			lg: 'p-8',
		},
	},
	defaultVariants: { gap: 'md', padding: 'none' },
})

export interface FormLayoutProps
	extends
		useRender.ComponentProps<'div'>,
		React.ComponentProps<'div'>,
		VariantProps<typeof formLayoutVariants> {}

function FormLayout({ gap, padding, render, className, ...props }: FormLayoutProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{ className: cn(formLayoutVariants({ gap, padding }), className) },
			props,
		),
		render,
	})
}

const formContentVariants = cva('flex flex-col', {
	variants: {
		gap: {
			sm: 'gap-4',
			md: 'gap-6',
			lg: 'gap-8',
			xl: 'gap-10',
		},
	},
	defaultVariants: { gap: 'lg' },
})

export interface FormContentProps
	extends
		useRender.ComponentProps<'div'>,
		React.ComponentProps<'div'>,
		VariantProps<typeof formContentVariants> {}

function FormContent({ gap, render, className, ...props }: FormContentProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>({ className: cn(formContentVariants({ gap }), className) }, props),
		render,
	})
}

/* -------------------------------------------------------------------------- */
/*  FormGrid                                                                  */
/* -------------------------------------------------------------------------- */

const formGridVariants = cva('grid items-start', {
	variants: {
		columns: {
			1: 'grid-cols-1',
			2: 'grid-cols-1 lg:grid-cols-2',
			3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
			4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
		},
		gapX: {
			sm: 'gap-x-4',
			md: 'gap-x-6',
			lg: 'gap-x-8',
			xl: 'gap-x-12',
		},
		gapY: {
			sm: 'gap-y-4',
			md: 'gap-y-6',
			lg: 'gap-y-8',
			xl: 'gap-y-10',
		},
	},
	defaultVariants: { columns: 2, gapX: 'lg', gapY: 'lg' },
})

export interface FormGridProps
	extends
		useRender.ComponentProps<'div'>,
		React.ComponentProps<'div'>,
		VariantProps<typeof formGridVariants> {}

function FormGrid({ columns, gapX, gapY, render, className, ...props }: FormGridProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{ className: cn(formGridVariants({ columns, gapX, gapY }), className) },
			props,
		),
		render,
	})
}

/* -------------------------------------------------------------------------- */
/*  FormSection                                                               */
/* -------------------------------------------------------------------------- */

const formSectionVariants = cva('flex flex-col animate-enter', {
	variants: {
		gap: {
			sm: 'gap-4',
			md: 'gap-6',
			lg: 'gap-8',
		},
		padding: {
			none: 'p-0',
			sm: 'px-1',
			md: 'px-2',
			lg: 'px-4',
		},
	},
	defaultVariants: { gap: 'md', padding: 'sm' },
})

export interface FormSectionProps
	extends
		useRender.ComponentProps<'div'>,
		React.ComponentProps<'div'>,
		VariantProps<typeof formSectionVariants> {
	title?: string
	description?: string
	titleSize?: 'sm' | 'md' | 'lg'
}

function FormSection({
	title,
	description,
	titleSize = 'md',
	gap,
	padding,
	className,
	children,
	render,
	...props
}: FormSectionProps) {
	const titleSizeClasses = {
		sm: 'text-lg',
		md: 'text-xl',
		lg: 'text-2xl',
	}

	const content = (
		<div className={cn(formSectionVariants({ gap, padding }), className)} {...props}>
			{(title ?? description) && (
				<div className="space-y-2">
					{title && (
						<h3
							className={cn(
								'font-bold tracking-tight lg:tracking-[-0.5px] text-foreground/90',
								titleSizeClasses[titleSize],
							)}
						>
							{title}
						</h3>
					)}
					{description && (
						<p className="text-sm text-muted-foreground/70 leading-relaxed max-w-2xl">
							{description}
						</p>
					)}
				</div>
			)}
			{children}
		</div>
	)

	return useRender({ defaultTagName: 'div', props: { children: content }, render })
}

/* -------------------------------------------------------------------------- */
/*  FormActions                                                               */
/* -------------------------------------------------------------------------- */

const formActionsVariants = cva('flex items-center', {
	variants: {
		align: {
			start: 'justify-start',
			center: 'justify-center',
			end: 'justify-end',
		},
		sticky: {
			none: '',
			only: 'sticky bottom-0 bg-background/80 backdrop-blur-xl z-10',
			withBorder:
				'sticky bottom-0 bg-background/80 backdrop-blur-xl z-10 border-t border-border/60',
		},
		padding: {
			none: '',
			sm: 'p-2',
			md: 'p-6',
			lg: 'p-8',
		},
	},
	defaultVariants: { align: 'end', sticky: 'withBorder', padding: 'md' },
})

export interface FormActionsProps
	extends
		useRender.ComponentProps<'div'>,
		React.ComponentProps<'div'>,
		VariantProps<typeof formActionsVariants> {}

function FormActions({ align, sticky, padding, className, render, ...props }: FormActionsProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{
				className: cn(formActionsVariants({ align, sticky, padding }), 'gap-3 pt-4', className),
			},
			props,
		),
		render,
	})
}

/* -------------------------------------------------------------------------- */
/*  FormCardSection                                                           */
/* -------------------------------------------------------------------------- */

type FormCardSectionProps = React.ComponentProps<typeof Card> & {
	title?: string
	description?: string
	footer?: React.ReactNode
}

function FormCardSection({
	className,
	title,
	description,
	children,
	footer,
	...props
}: FormCardSectionProps) {
	return (
		<Card
			className={cn(
				'overflow-hidden transition-all duration-300 border-border/60 hover:border-border shadow-card hover:shadow-deep',
				className,
			)}
			size="sm"
			{...props}
		>
			{(title ?? description) && (
				<CardHeader className="border-b border-border/60 bg-muted/30 pb-5">
					{title && <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>}
					{description && (
						<CardDescription className="text-sm text-muted-foreground/70">
							{description}
						</CardDescription>
					)}
				</CardHeader>
			)}
			<CardContent className="pt-8 px-8">
				<div className="flex flex-col gap-8">{children}</div>
			</CardContent>
			{footer && (
				<CardFooter className="border-t border-border/60 bg-muted/10 px-8 py-4">
					{footer}
				</CardFooter>
			)}
		</Card>
	)
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

FormLayout.Content = FormContent
FormLayout.Grid = FormGrid
FormLayout.Section = FormSection
FormLayout.Actions = FormActions
FormLayout.CardSection = FormCardSection

export { FormLayout }
