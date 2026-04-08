import { Link } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { ArrowLeftIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'

const pageVariants = cva('w-full mx-auto flex-1 flex py-8 flex-col gap-6 animate-enter', {
  variants: { size: { sm: 'max-w-2xl', md: 'max-w-4xl', lg: 'max-w-5xl', xl: 'max-w-6xl', full: 'max-w-none' } },
})

function Page({ size = 'lg', className, ...props }: ComponentProps<'div'> & VariantProps<typeof pageVariants>) {
  return <div {...props} className={cn(pageVariants({ size, className }))} />
}

function Header({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('flex gap-4 px-6', className)} />
}

function Title({ className, ...props }: ComponentProps<'h1'>) {
  return <h1 {...props} className={cn('text-3xl font-bold tracking-tight text-foreground/90 lg:text-4xl', className)} />
}

function Description({ className, ...props }: ComponentProps<'p'>) {
  return <p {...props} className={cn('text-muted-foreground/80 text-base leading-relaxed max-w-2xl', className)} />
}

function BackButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'shrink-0 hover:bg-accent/50 hover:text-accent-foreground transition-all duration-200 active:scale-95',
        className,
      )}
      nativeButton={false}
      {...props}
    >
      <ArrowLeftIcon className="size-5" />
    </Button>
  )
}

function Actions({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('flex gap-3 justify-end items-center', className)} />
}

function Content({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('px-6', className)} />
}

interface BlockHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  back?: LinkOptions | (() => void)
  border?: boolean
}

function BlockHeader({ title, description, action, back, border }: BlockHeaderProps) {
  return (
    <Header
      className={cn(
        'items-start transition-all duration-300',
        border ? 'border-b bg-accent/5 backdrop-blur-sm pb-8 mb-4 sticky top-0 z-10 -mx-6 px-12' : 'mb-4',
      )}
    >
      {back && (
        <div className="lg:mr-4 pt-1">
          {typeof back === 'function' ? (
            <BackButton type="button" onClick={back} />
          ) : (
            <BackButton render={<Link {...back} />} />
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-y-6 grow gap-x-12 items-center">
        <div className="flex flex-col grow gap-1.5">
          <Title className="grow">{title}</Title>
          {description && <Description className="text-wrap">{description}</Description>}
        </div>
        {action && <Actions className={cn('items-center gap-2 flex flex-wrap justify-start')}>{action}</Actions>}
      </div>
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
// Page.SimpleHeader = SimpleHeader
Page.BlockHeader = BlockHeader

export { Page }
