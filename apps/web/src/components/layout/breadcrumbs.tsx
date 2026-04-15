import * as React from 'react'
import { useMemo } from 'react'

import { Link, useLocation } from '@tanstack/react-router'

import { getAppMenu } from '@/config/app-menu'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export function Breadcrumbs() {
	const { pathname } = useLocation()
	const menu = useMemo(() => getAppMenu(pathname), [pathname])

	const breadcrumbs = useMemo(() => {
		const items: Array<{ title: string; href: string }> = []

		// Flatten menu items for easier matching
		const allItems = menu.flatMap((group) => group.items)

		// Find matching top-level items
		const activeTopItem = allItems.find(
			(item) => item.href !== '/' && pathname.startsWith(item.href),
		)

		if (activeTopItem) {
			items.push({ title: activeTopItem.title, href: activeTopItem.href })

			// Find matching child item
			if (activeTopItem.children) {
				const activeChild = activeTopItem.children.find((child) => pathname === child.href)
				if (activeChild) {
					items.push({ title: activeChild.title, href: activeChild.href })
				}
			}
		}

		return items
	}, [menu, pathname])

	return (
		<Breadcrumb className="min-w-0">
			<BreadcrumbList className="flex-nowrap gap-x-1.5 min-w-0">
				<BreadcrumbItem>
					<BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
				</BreadcrumbItem>
				{breadcrumbs.map((crumb, index) => (
					<React.Fragment key={index}>
						<BreadcrumbSeparator />
						<BreadcrumbItem className="max-w-[120px] md:max-w-[240px] min-w-0">
							{index === breadcrumbs.length - 1 ? (
								<BreadcrumbPage className="truncate inline-block" title={crumb.title}>
									{crumb.title}
								</BreadcrumbPage>
							) : (
								<BreadcrumbLink
									render={<Link to={crumb.href} />}
									className="truncate inline-block"
									title={crumb.title}
								>
									{crumb.title}
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
