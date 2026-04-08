import type { ReactNode } from 'react'

import type { DescriptionItem } from '@/components/data-display/description-list'
import { DescriptionList } from '@/components/data-display/description-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface DetailCardProps {
  title: string
  description?: string
  items: Array<DescriptionItem>
  action?: ReactNode
  isLoading?: boolean
  className?: string
  /** Layout for the description list */
  layout?: 'vertical' | 'horizontal'
  /** Number of columns for the description list grid */
  columns?: 1 | 2 | 3
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * DetailCard — Card wrapper around DescriptionList for consistent detail views.
 *
 * @example
 * ```tsx
 * <DetailCard
 *   title="Informasi Material"
 *   items={[
 *     { term: 'Nama', description: material.name },
 *     { term: 'SKU', description: material.sku },
 *     { term: 'Status', description: <ActiveStatusBadge status={toActiveStatus(material.isActive)} /> },
 *   ]}
 * />
 * ```
 */
export function DetailCard({
  title,
  description,
  items,
  action,
  isLoading = false,
  className,
  layout = 'horizontal',
  columns = 1,
}: DetailCardProps) {
  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <DetailCardSkeleton count={items.length} />
        ) : (
          <DescriptionList items={items} layout={layout} columns={columns} />
        )}
      </CardContent>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                  */
/* -------------------------------------------------------------------------- */

function DetailCardSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skeleton-${String(i)}`} className="flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}
