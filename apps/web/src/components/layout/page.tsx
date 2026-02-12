import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

interface PageProps extends ComponentProps<'div'> {
  /**
   * Size variant affects max-width of content
   * - sm: 1024px (compact forms, settings)
   * - md: 1280px (default, balanced)
   * - lg: 1536px (dashboards, tables)
   * - xl: 1600px (wide layouts)
   * - full: no constraint
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

function Page({ size = 'xl', className, ...props }: PageProps) {
  return (
    <div
      {...props}
      className={cn(
        'w-full mx-auto py-4 flex-1 flex flex-col gap-6 md:pt-6',
        size === 'sm' && 'max-w-4xl',
        size === 'md' && 'max-w-5xl',
        size === 'lg' && 'max-w-6xl',
        size === 'xl' && 'max-w-7xl',
        className,
      )}
    />
  )
}

interface SimpleHeaderProps {
  title: string
  description?: string
}

function SimpleHeader({ title, description }: SimpleHeaderProps) {
  return (
    <div className="flex flex-col gap-1 border-b pb-4 px-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground text-sm truncate leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

interface ContentProps extends ComponentProps<'div'> {}

function Content({ className, ...props }: ContentProps) {
  return <div {...props} className={cn('px-4', className)} />
}

Page.SimpleHeader = SimpleHeader
Page.Content = Content

export { Page }
