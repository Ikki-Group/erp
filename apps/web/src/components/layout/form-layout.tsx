import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'

/* -------------------------------------------------------------------------- */
/*  FormLayout                                                                */
/* -------------------------------------------------------------------------- */

const formLayoutVariants = cva('flex flex-1 flex-col animate-enter', {
  variants: {
    gap: {
      sm: 'gap-6',
      md: 'gap-8',
      lg: 'gap-10',
    },
  },
  defaultVariants: {
    gap: 'md',
  },
})

type FormLayoutProps = useRender.ComponentProps<'div'> & React.ComponentProps<'div'> & VariantProps<typeof formLayoutVariants>

function FormLayout({ gap, render, className, ...props }: FormLayoutProps) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>({ className: cn(formLayoutVariants({ gap }), className) }, props),
    render,
  })
}

function FormContent({ className, render, ...props }: useRender.ComponentProps<'div'> & React.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>({ className: cn('flex flex-col gap-8', className) }, props),
    render,
  })
}

/* -------------------------------------------------------------------------- */
/*  FormGrid                                                                  */
/* -------------------------------------------------------------------------- */

const formGridVariants = cva('grid gap-y-8 items-start', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 lg:grid-cols-2 gap-x-10',
      3: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-x-12',
    },
  },
  defaultVariants: {
    columns: 2,
  },
})

type FormGridProps = useRender.ComponentProps<'div'> & React.ComponentProps<'div'> & VariantProps<typeof formGridVariants>

function FormGrid({ columns, render, className, ...props }: FormGridProps) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>({ className: cn(formGridVariants({ columns }), className) }, props),
    render,
  })
}

/* -------------------------------------------------------------------------- */
/*  FormSection                                                               */
/* -------------------------------------------------------------------------- */

type FormSectionProps = useRender.ComponentProps<'div'> & React.ComponentProps<'div'> & {
  title?: string
  description?: string
}

function FormSection({ title, description, className, children, render, ...props }: FormSectionProps) {
  const content = (
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

  return useRender({
    defaultTagName: 'div',
    props: { children: content },
    render,
  })
}

/* -------------------------------------------------------------------------- */
/*  FormActions                                                               */
/* -------------------------------------------------------------------------- */

function FormActions({ className, render, ...props }: useRender.ComponentProps<'div'> & React.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'flex items-center justify-end gap-3 pt-6 border-t mt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-6 -mx-6 px-12 z-10',
          className,
        ),
      },
      props,
    ),
    render,
  })
}

/* -------------------------------------------------------------------------- */
/*  FormCardSection                                                           */
/* -------------------------------------------------------------------------- */

type FormCardSectionProps = React.ComponentProps<typeof Card> & {
  title?: string
  description?: string
  footer?: React.ReactNode
}

function FormCardSection({ className, title, description, children, footer, ...props }: FormCardSectionProps) {
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

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

FormLayout.Content = FormContent
FormLayout.Grid = FormGrid
FormLayout.Section = FormSection
FormLayout.Actions = FormActions
FormLayout.CardSection = FormCardSection

export { FormLayout }
