import * as React from 'react'
import { Link, useMatches, useRouter } from '@tanstack/react-router'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Breadcrumbs() {
  const matches = useMatches()
  const router = useRouter()

  // Filter matches to get those with a title or that are meaningful
  const breadcrumbMatches = matches.filter(
    (match) =>
      match.routeId !== '__root__' &&
      (match.staticData as any)?.breadcrumb !== false,
  )

  const handleBack = () => {
    router.history.back()
  }

  if (breadcrumbMatches.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleBack}
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
      </Button>

      <div className="h-4 w-[1px] bg-border mx-1" />

      <ol className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
        {breadcrumbMatches.map((match, index) => {
          const isLast = index === breadcrumbMatches.length - 1
          // Fallback to route ID if breadcrumb title not provided
          const label =
            (match.staticData as any)?.breadcrumb ||
            match.pathname.split('/').filter(Boolean).pop() ||
            'Home'

          const capitalizedLabel =
            label.charAt(0).toUpperCase() + label.slice(1)

          return (
            <React.Fragment key={match.id}>
              {index > 0 && (
                <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
              )}
              <li className="flex items-center">
                {isLast ? (
                  <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-[200px]">
                    {capitalizedLabel}
                  </span>
                ) : (
                  <Link
                    to={match.pathname}
                    className="text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
                  >
                    {capitalizedLabel}
                  </Link>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
