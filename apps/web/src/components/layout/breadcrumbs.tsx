import { Link, useLocation } from '@tanstack/react-router'
import * as React from 'react'
import { useMemo } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getAppMenu } from '@/config/app-menu'

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const menu = useMemo(() => getAppMenu(pathname), [pathname])

  const breadcrumbs = useMemo(() => {
    const items: Array<{ title: string; href: string }> = []

    // Flatten menu items for easier matching
    const allItems = menu.flatMap((group) => group.items)

    // Find matching top-level items
    const activeTopItem = allItems.find((item) => item.href !== '/' && pathname.startsWith(item.href))

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
    <Breadcrumb className="animate-fade-in">
      <BreadcrumbList className="flex-wrap gap-y-1">
        <BreadcrumbItem>
          <BreadcrumbLink
            className="text-muted-foreground/60 transition-colors hover:text-foreground"
            render={<Link to="/" />}
          >
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbSeparator className="text-muted-foreground/30" />
            <BreadcrumbItem>
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage className="font-semibold text-foreground/80">{crumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  className="text-muted-foreground/60 transition-colors hover:text-foreground"
                  render={<Link to={crumb.href} />}
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
