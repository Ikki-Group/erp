import { Link } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { ArrowLeftIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'

const pageVariants = cva('w-full mx-auto flex-1 flex py-6 flex-col gap-4', {
  variants: { size: { sm: 'max-w-2xl', md: 'max-w-4xl', lg: 'max-w-5xl', xl: 'max-w-6xl', full: 'max-w-none' } },
})

function Page({ size = 'lg', className, ...props }: ComponentProps<'div'> & VariantProps<typeof pageVariants>) {
  return <div {...props} className={cn(pageVariants({ size, className }))} />
}

function Header({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('flex gap-2.5 px-4', className)} />
}

function Title({ className, ...props }: ComponentProps<'h1'>) {
  return <h1 {...props} className={cn('text-2xl font-semibold tracking-tight truncate', className)} />
}

function Description({ className, ...props }: ComponentProps<'p'>) {
  return <p {...props} className={cn('text-muted-foreground text-sm truncate leading-relaxed', className)} />
}

function BackButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" size="icon-sm" className={cn('shrink-0', className)} nativeButton={false} {...props}>
      <ArrowLeftIcon />
    </Button>
  )
}

function Actions({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('flex gap-2 justify-end', className)} />
}

function Content({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('px-4', className)} />
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
    <Header className={cn('items-start', border ? 'border-b pb-6 mb-2' : 'mb-2')}>
      {back && (
        <div className="lg:mr-2">
          {typeof back === 'function' ? (
            <BackButton type="button" onClick={back} />
          ) : (
            <BackButton render={<Link {...back} />} />
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-y-4 grow gap-x-8">
        <div className="flex flex-col grow gap-0.5">
          <Title className="grow">{title}</Title>
          {description && <Description className="text-wrap">{description}</Description>}
        </div>
        {action && (
          <Actions className={cn('items-end gap-1 flex flex-wrap justify-start', !!description && '')}>
            {action}
          </Actions>
        )}
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
