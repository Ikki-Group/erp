import * as React from 'react'
import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva } from 'class-variance-authority'
import { ArrowLeftIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'
import { Breadcrumbs } from './breadcrumbs'
import type { VariantProps } from 'class-variance-authority'

const pageVariants = cva('w-full mx-auto flex-1 flex py-8 flex-col animate-enter', {
	variants: {
		size: {
			sm: 'max-w-2xl',
			md: 'max-w-4xl',
			lg: 'max-w-5xl',
			xl: 'max-w-6xl',
			full: 'max-w-none',
		},
		padding: {
			none: 'py-0',
			sm: 'py-4',
			md: 'py-8',
			lg: 'py-12',
		},
	},
	defaultVariants: { size: 'lg', padding: 'md' },
})

export interface PageProps
	extends
		useRender.ComponentProps<'div'>,
		React.ComponentProps<'div'>,
		VariantProps<typeof pageVariants> {}

function Page({ size, padding, render, className, ...props }: PageProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>({ className: cn(pageVariants({ size, padding }), className) }, props),
		render,
	})
}

const headerVariants = cva('flex gap-4 px-6', {
	variants: {
		align: {
			start: 'items-start',
			center: 'items-center',
			end: 'items-end',
		},
		padding: {
			none: 'px-0',
			sm: 'px-4',
			md: 'px-6',
			lg: 'px-8',
		},
	},
	defaultVariants: { align: 'center', padding: 'md' },
})

export interface HeaderProps
	extends
		useRender.ComponentProps<'div'>,
		React.ComponentProps<'div'>,
		VariantProps<typeof headerVariants> {}

function Header({ align, padding, className, render, ...props }: HeaderProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{ className: cn(headerVariants({ align, padding }), className) },
			props,
		),
		render,
	})
}

const titleVariants = cva('font-bold tracking-tight text-foreground/90', {
	variants: {
		size: {
			sm: 'text-lg lg:text-xl',
			md: 'text-xl lg:text-2xl',
			lg: 'text-2xl lg:text-3xl',
			xl: 'text-3xl lg:text-4xl',
		},
		tracking: {
			normal: 'tracking-normal',
			tight: 'tracking-tight',
			tighter: 'tracking-[-0.5px]',
		},
	},
	defaultVariants: { size: 'md', tracking: 'tight' },
})

export interface TitleProps
	extends
		useRender.ComponentProps<'h1'>,
		React.ComponentProps<'h1'>,
		VariantProps<typeof titleVariants> {}

function Title({ size, tracking, className, render, ...props }: TitleProps) {
	return useRender({
		defaultTagName: 'h1',
		props: mergeProps<'h1'>(
			{
				className: cn(titleVariants({ size, tracking }), className),
			},
			props,
		),
		render,
	})
}

const descriptionVariants = cva('leading-relaxed', {
	variants: {
		size: {
			sm: 'text-sm',
			md: 'text-base',
			lg: 'text-lg',
		},
		maxWidth: {
			none: 'max-w-none',
			sm: 'max-w-xl',
			md: 'max-w-2xl',
			lg: 'max-w-3xl',
		},
	},
	defaultVariants: { size: 'sm', maxWidth: 'md' },
})

export interface DescriptionProps
	extends
		useRender.ComponentProps<'p'>,
		React.ComponentProps<'p'>,
		VariantProps<typeof descriptionVariants> {}

function Description({ size, maxWidth, className, render, ...props }: DescriptionProps) {
	return useRender({
		defaultTagName: 'p',
		props: mergeProps<'p'>(
			{
				className: cn(
					'text-muted-foreground/70',
					descriptionVariants({ size, maxWidth }),
					className,
				),
			},
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
			className={cn('shrink-0', className)}
			nativeButton={false}
			{...props}
		>
			<ArrowLeftIcon className="size-5" />
		</Button>
	)
}

const actionsVariants = cva('flex gap-3', {
	variants: {
		align: {
			start: 'justify-start',
			center: 'justify-center',
			end: 'justify-end',
		},
		wrap: {
			nowrap: 'flex-nowrap',
			wrap: 'flex-wrap',
		},
	},
	defaultVariants: { align: 'end', wrap: 'wrap' },
})

export interface ActionsProps
	extends
		useRender.ComponentProps<'div'>,
		React.ComponentProps<'div'>,
		VariantProps<typeof actionsVariants> {}

function Actions({ align, wrap, className, render, ...props }: ActionsProps) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{ className: cn(actionsVariants({ align, wrap }), 'items-center', className) },
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
		props: mergeProps<'div'>({ className: cn('px-6 flex flex-col gap-6', className) }, props),
		render,
	})
}

export interface BreadcrumbItem {
	label: string
	href?: string
}

export interface BlockHeaderProps {
	title: string
	description?: string
	action?: ReactNode
	back?: LinkOptions | (() => void)
	border?: boolean
	size?: 'sm' | 'md' | 'lg'
	breadcrumbs?: Array<BreadcrumbItem>
}

function BlockHeader({
	title,
	description,
	action,
	back,
	border,
	size = 'md',
	breadcrumbs,
}: BlockHeaderProps) {
	const sizeClasses = {
		sm: 'pb-3 mb-2',
		md: 'pb-5 mb-4',
		lg: 'pb-8 mb-6',
	}

	const titleSize = {
		sm: 'sm' as const,
		md: 'md' as const,
		lg: 'lg' as const,
	}[size]

	return (
		<Header
			align="start"
			className={cn(
				'transition-all duration-300',
				border
					? `border-b bg-accent/5 backdrop-blur-sm sticky top-0 z-10 -mx-6 px-8 ${sizeClasses[size]}`
					: sizeClasses[size],
			)}
		>
			{back && (
				<div className="lg:mr-2 pt-1">
					{typeof back === 'function' ? (
						<BackButton type="button" onClick={back} />
					) : (
						<BackButton render={<Link {...back} />} />
					)}
				</div>
			)}
			<div className="flex flex-col gap-4 grow">
				{breadcrumbs && breadcrumbs.length > 0 && (
					<div className="flex items-center gap-2">
						{back && <div className="w-6" />}
						<Breadcrumbs />
					</div>
				)}
				<div className="flex flex-wrap gap-y-6 gap-x-12 items-center">
					<div className="flex flex-col grow gap-1">
						<Title size={titleSize} className="grow">
							{title}
						</Title>
						{description && <Description className="text-wrap">{description}</Description>}
					</div>
					{action && (
						<Actions align="start" className="gap-2">
							{action}
						</Actions>
					)}
				</div>
			</div>
		</Header>
	)
}

Page.Content = Content
Page.Header = Header
Page.Title = Title
Page.Description = Description
Page.BackButton = BackButton
Page.Actions = Actions
Page.BlockHeader = BlockHeader

export { Page }
