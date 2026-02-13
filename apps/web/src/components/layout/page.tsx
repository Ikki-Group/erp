import { cn } from '@/lib/utils'
import { Link, LinkOptions } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { ComponentProps } from 'react'
import { Button } from '../ui/button'

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
        'w-full mx-auto py-4 flex-1 flex flex-col gap-6 @xl:pt-6',
        size === 'sm' && 'max-w-4xl',
        size === 'md' && 'max-w-5xl',
        size === 'lg' && 'max-w-6xl',
        size === 'xl' && 'max-w-7xl',
        className,
      )}
    />
  )
}

function Header({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn('flex items-start gap-2.5 px-4 pb-4 border-b', className)}
    />
  )
}

function Title({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      {...props}
      className={cn(
        'text-2xl font-semibold tracking-tight text-foreground truncate',
        className,
      )}
    />
  )
}

function Description({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      {...props}
      className={cn(
        'text-muted-foreground text-sm truncate leading-relaxed mt-1',
        className,
      )}
    />
  )
}

function BackButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={cn('mt-0.5 shrink-0', className)}
      nativeButton={false}
      {...props}
    >
      <ArrowLeftIcon />
    </Button>
  )
}

function Actions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        'w-max flex flex-1 gap-2 items-center self-center',
        className,
      )}
    />
  )
}

function Content({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('px-4', className)} />
}

interface SimpleHeaderProps {
  title: string
  description?: string
  back?: LinkOptions
  action?: React.ReactNode
}

function SimpleHeader({ title, description, back, action }: SimpleHeaderProps) {
  return (
    <Header className="flex-wrap gap-y-4">
      {back && <BackButton render={<Link {...back} />} />}
      <div className="flex-1">
        <Title>{title}</Title>
        {description && <Description>{description}</Description>}
      </div>
      {action && <Actions>{action}</Actions>}
    </Header>
  )
}

// Primitive
Page.Content = Content
Page.Header = Header
Page.Title = Title
Page.Description = Description
Page.BackButton = BackButton
Page.Actions = Actions

// Template
Page.SimpleHeader = SimpleHeader

export { Page }
