import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function FormLayout({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-1 flex-col gap-6', className)} {...props} />
  )
}

function FormContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-6', className)} {...props} />
}

function FormGrid({
  className,
  columns = 2,
  ...props
}: ComponentProps<'div'> & { columns?: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        'grid gap-6 items-start',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 lg:grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
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
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      {(title || description) && (
        <div className='space-y-1'>
          {title && (
            <h3 className='font-semibold leading-none tracking-tight'>
              {title}
            </h3>
          )}
          {description && (
            <p className='text-sm text-muted-foreground'>{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

function FormActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2', className)}
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
}: ComponentProps<typeof Card> & {
  title?: string
  description?: string
  footer?: React.ReactNode
}) {
  return (
    <Card className={cn('overflow-hidden', className)} size='sm' {...props}>
      {(title || description) && (
        <CardHeader className='border-b'>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className='pt-6'>
        <div className='flex flex-col gap-6'>{children}</div>
      </CardContent>
      {footer && (
        <CardFooter className='border-t bg-muted/30'>{footer}</CardFooter>
      )}
    </Card>
  )
}

FormLayout.Content = FormContent
FormLayout.Grid = FormGrid
FormLayout.Section = FormSection
FormLayout.Actions = FormActions
FormLayout.CardSection = FormCardSection

export { FormLayout }
