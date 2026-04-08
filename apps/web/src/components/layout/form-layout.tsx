import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'

function FormLayout({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-1 flex-col gap-8 animate-enter', className)} {...props} />
}

function FormContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-8', className)} {...props} />
}

function FormGrid({ className, columns = 2, ...props }: ComponentProps<'div'> & { columns?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        'grid gap-x-10 gap-y-8 items-start',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 lg:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3',
        className,
      )}
      {...props}
    />
  )
}

function FormSection({
  className,
  title,
  description,
  children,
  ...props
}: ComponentProps<'div'> & { title?: string; description?: string }) {
  return (
    <div className={cn('flex flex-col gap-6 animate-enter', className)} {...props}>
      {(title ?? description) && (
        <div className="space-y-1.5 px-1">
          {title && <h3 className="text-xl font-bold tracking-tight text-foreground/90">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-2xl">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

function FormActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 pt-6 border-t mt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-6 -mx-6 px-12 z-10',
        className,
      )}
      {...props}
    />
  )
}

function FormCardSection({
  className,
  title,
  description,
  children,
  footer,
  ...props
}: ComponentProps<typeof Card> & { title?: string; description?: string; footer?: React.ReactNode }) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 border-border/50 hover:border-primary/30 hover:shadow-lg shadow-sm/5',
        className,
      )}
      size="sm"
      {...props}
    >
      {(title ?? description) && (
        <CardHeader className="border-b bg-muted/20 pb-5">
          {title && <CardTitle className="text-lg font-bold tracking-tight">{title}</CardTitle>}
          {description && <CardDescription className="text-sm text-muted-foreground/70">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="pt-8 px-8">
        <div className="flex flex-col gap-8">{children}</div>
      </CardContent>
      {footer && <CardFooter className="border-t bg-muted/5 px-8 py-4">{footer}</CardFooter>}
    </Card>
  )
}

FormLayout.Content = FormContent
FormLayout.Grid = FormGrid
FormLayout.Section = FormSection
FormLayout.Actions = FormActions
FormLayout.CardSection = FormCardSection

export { FormLayout }
