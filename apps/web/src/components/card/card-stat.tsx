import { LucideIcon } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'

export interface CardStatProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  isLoading?: boolean
}

export function CardStat({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: CardStatProps) {
  return (
    <div className="flex flex-1 items-center gap-4 p-2 rounded-xl border bg-card text-card-foreground shadow-sm min-w-[200px] hover:shadow-md transition-all">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/5">
        <Icon className="size-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold">
            {isLoading ? <Skeleton className="w-20 h-6" /> : value}
          </p>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    </div>
  )
}
