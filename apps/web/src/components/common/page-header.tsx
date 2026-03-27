import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'
import type { ReactNode } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface BreadcrumbStep {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Array<BreadcrumbStep>
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * PageHeader — Core layout component for page titles, breadcrumbs and actions.
 * Usually placed at the top of a Page.
 */
export function PageHeader({ title, description, breadcrumbs, actions, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((step, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <Fragment key={step.label}>
                  <BreadcrumbItem>
                    {isLast || !step.href ? (
                      <BreadcrumbPage>{step.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link to={step.href as any}>{step.label}</Link>} />
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Tabs or Extra content */}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
