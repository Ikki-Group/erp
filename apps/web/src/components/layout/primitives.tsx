import * as React from 'react'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import type { VariantProps } from 'class-variance-authority'

/* -------------------------------------------------------------------------- */
/*  Section                                                                   */
/* -------------------------------------------------------------------------- */

const sectionVariants = cva('space-y-6')

type SectionProps = useRender.ComponentProps<'section'> &
	React.ComponentProps<'section'> &
	VariantProps<typeof sectionVariants>

function Section({ render, className, ...props }: SectionProps) {
	return useRender({
		defaultTagName: 'section',
		props: mergeProps<'section'>({ className: cn(sectionVariants(), className) }, props),
		render,
	})
}

/* -------------------------------------------------------------------------- */
/*  SectionHeader                                                             */
/* -------------------------------------------------------------------------- */

type SectionHeaderProps = useRender.ComponentProps<'div'> &
	React.ComponentProps<'div'> & { title?: string; description?: string; action?: React.ReactNode }

function SectionHeader({
	title,
	description,
	action,
	className,
	children,
	render,
	...props
}: SectionHeaderProps) {
	const content = (
		<div className={cn('flex items-center justify-between gap-4', className)} {...props}>
			{(title ?? description ?? children) && (
				<div className="space-y-1">
					{title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
					{description && <p className="text-sm text-muted-foreground">{description}</p>}
					{children}
				</div>
			)}
			{action && <div className="flex items-center gap-2">{action}</div>}
		</div>
	)

	return useRender({ defaultTagName: 'div', props: { children: content }, render })
}

/* -------------------------------------------------------------------------- */
/*  Grid                                                                      */
/* -------------------------------------------------------------------------- */

const gridVariants = cva('grid', {
	variants: {
		cols: {
			1: 'grid-cols-1',
			2: 'grid-cols-1 md:grid-cols-2',
			3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
			4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
			6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
		},
		gap: { sm: 'gap-4', md: 'gap-6', lg: 'gap-8' },
	},
	defaultVariants: { cols: 2, gap: 'md' },
})

type GridProps = useRender.ComponentProps<'div'> &
	React.ComponentProps<'div'> &
	VariantProps<typeof gridVariants>

function Grid({ cols, gap, render, className, ...props }: GridProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>({ className: cn(gridVariants({ cols, gap }), className) }, props),
		render,
	})
}

/* -------------------------------------------------------------------------- */
/*  Stack                                                                     */
/* -------------------------------------------------------------------------- */

const stackVariants = cva('flex flex-col', {
	variants: {
		gap: { sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' },
		align: {
			start: 'items-start',
			center: 'items-center',
			end: 'items-end',
			stretch: 'items-stretch',
		},
	},
	defaultVariants: { gap: 'md', align: 'stretch' },
})

type StackProps = useRender.ComponentProps<'div'> &
	React.ComponentProps<'div'> &
	VariantProps<typeof stackVariants>

function Stack({ gap, align, render, className, ...props }: StackProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>({ className: cn(stackVariants({ gap, align }), className) }, props),
		render,
	})
}

/* -------------------------------------------------------------------------- */
/*  Inline                                                                    */
/* -------------------------------------------------------------------------- */

const inlineVariants = cva('flex', {
	variants: {
		gap: { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' },
		align: {
			start: 'items-start',
			center: 'items-center',
			end: 'items-end',
			baseline: 'items-baseline',
		},
		justify: {
			start: 'justify-start',
			center: 'justify-center',
			end: 'justify-end',
			between: 'justify-between',
		},
		wrap: { true: 'flex-wrap', false: 'flex-nowrap' },
	},
	defaultVariants: { gap: 'md', align: 'center', justify: 'start', wrap: false },
})

type InlineProps = useRender.ComponentProps<'div'> &
	React.ComponentProps<'div'> &
	VariantProps<typeof inlineVariants>

function Inline({ gap, align, justify, wrap, render, className, ...props }: InlineProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{ className: cn(inlineVariants({ gap, align, justify, wrap }), className) },
			props,
		),
		render,
	})
}

export { Section, SectionHeader, Grid, Stack, Inline }
