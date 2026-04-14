import type { VariantProps } from 'class-variance-authority'

import * as React from 'react'

import { Link } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva } from 'class-variance-authority'
import { ArrowLeftIcon } from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const pageVariants = cva('w-full mx-auto flex-1 flex py-8 flex-col gap-4 animate-enter', {
	variants: {
		size: {
			sm: 'max-w-2xl',
			md: 'max-w-4xl',
			lg: 'max-w-5xl',
			xl: 'max-w-6xl',
			full: 'max-w-none',
		},
	},
	defaultVariants: { size: 'lg' },
})

type PageProps = useRender.ComponentProps<'div'> &
	React.ComponentProps<'div'> &
	VariantProps<typeof pageVariants>

function Page({ size, render, className, ...props }: PageProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>({ className: cn(pageVariants({ size }), className) }, props),
		render,
	})
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function Header({
	className,
	render,
	...props
}: useRender.ComponentProps<'div'> & React.ComponentProps<'div'>) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>({ className: cn('flex gap-4 px-6', className) }, props),
		render,
	})
}

function Title({
	className,
	render,
	...props
}: useRender.ComponentProps<'h1'> & React.ComponentProps<'h1'>) {
	return useRender({
		defaultTagName: 'h1',
		props: mergeProps<'h1'>(
			{
				className: cn('text-xl font-bold tracking-tight text-foreground/90 lg:text-2xl lg:tracking-[-0.5px]', className),
			},
			props,
		),
		render,
	})
}

function Description({
	className,
	render,
	...props
}: useRender.ComponentProps<'p'> & React.ComponentProps<'p'>) {
	return useRender({
		defaultTagName: 'p',
		props: mergeProps<'p'>(
			{ className: cn('text-muted-foreground/70 text-sm leading-relaxed max-w-2xl', className) },
			props,
		),
		render,
	})
}

function BackButton({ className, ...props }: React.ComponentProps<typeof Button>) {
	return (
		<Button
			variant="ghost"
			size="icon"
			className={cn(
				'shrink-0 hover:bg-accent/50 hover:text-accent-foreground transition-all duration-200 active:scale-95',
				className,
			)}
			nativeButton={false}
			{...props}
		>
			<ArrowLeftIcon className="size-5" />
		</Button>
	)
}

function Actions({
	className,
	render,
	...props
}: useRender.ComponentProps<'div'> & React.ComponentProps<'div'>) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{ className: cn('flex gap-3 justify-end items-center', className) },
			props,
		),
		render,
	})
}

function Content({
	className,
	render,
	...props
}: useRender.ComponentProps<'div'> & React.ComponentProps<'div'>) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>({ className: cn('px-6', className) }, props),
		render,
	})
}

/* -------------------------------------------------------------------------- */
/*  BlockHeader (Compound Template)                                           */
/* -------------------------------------------------------------------------- */

interface BlockHeaderProps {
	title: string
	description?: string
	action?: React.ReactNode
	back?: LinkOptions | (() => void)
	border?: boolean
}

function BlockHeader({ title, description, action, back, border }: BlockHeaderProps) {
	return (
		<Header
			className={cn(
				'items-start transition-all duration-300',
				border
					? 'border-b bg-accent/5 backdrop-blur-sm pb-8 mb-4 sticky top-0 z-10 -mx-6 px-8'
					: 'mb-4',
			)}
		>
			{back && (
				<div className="lg:mr-4 pt-1">
					{typeof back === 'function' ? (
						<BackButton type="button" onClick={back} />
					) : (
						<BackButton render={<Link {...back} />} />
					)}
				</div>
			)}
			<div className="flex flex-wrap gap-y-6 grow gap-x-12 items-center">
				<div className="flex flex-col grow gap-1">
					<Title className="grow">{title}</Title>
					{description && <Description className="text-wrap">{description}</Description>}
				</div>
				{action && (
					<Actions className={cn('items-center gap-2 flex flex-wrap justify-start')}>
						{action}
					</Actions>
				)}
			</div>
		</Header>
	)
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

Page.Content = Content
Page.Header = Header
Page.Title = Title
Page.Description = Description
Page.BackButton = BackButton
Page.Actions = Actions
Page.BlockHeader = BlockHeader

export { Page }
