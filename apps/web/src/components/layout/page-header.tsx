import * as React from 'react'
import { Fragment } from 'react'
import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { useRender } from '@base-ui/react/use-render'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface BreadcrumbStep {
	label: string
	href?: string
}

interface PageHeaderProps extends useRender.ComponentProps<'div'>, React.ComponentProps<'div'> {
	title: string
	description?: string
	breadcrumbs?: Array<BreadcrumbStep>
	actions?: ReactNode
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function PageHeader({
	title,
	description,
	breadcrumbs,
	actions,
	children,
	className,
	render,
	...props
}: PageHeaderProps) {
	const content = (
		<div className={cn('flex flex-col gap-6 animate-enter', className)} {...props}>
			{breadcrumbs && breadcrumbs.length > 0 && (
				<Breadcrumb>
					<BreadcrumbList className="flex-wrap gap-y-1">
						{breadcrumbs.map((step, index) => {
							const isLast = index === breadcrumbs.length - 1
							return (
								<Fragment key={step.label}>
									<BreadcrumbItem>
										{isLast || !step.href ? (
											<BreadcrumbPage className="font-medium text-foreground/70">
												{step.label}
											</BreadcrumbPage>
										) : (
											<BreadcrumbLink
												className="text-muted-foreground/60 transition-colors hover:text-foreground"
												render={<Link to={step.href}>{step.label}</Link>}
											/>
										)}
									</BreadcrumbItem>
									{!isLast && <BreadcrumbSeparator className="text-muted-foreground/30" />}
								</Fragment>
							)
						})}
					</BreadcrumbList>
				</Breadcrumb>
			)}

			<div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1.5">
					<h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 lg:text-4xl">
						{title}
					</h1>
					{description && (
						<p className="text-base text-muted-foreground/80 leading-relaxed max-w-2xl">
							{description}
						</p>
					)}
				</div>
				{actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
			</div>

			{children && <div className="mt-2">{children}</div>}
		</div>
	)

	return useRender({ defaultTagName: 'div', props: { children: content }, render })
}
