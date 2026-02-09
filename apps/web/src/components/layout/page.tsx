import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Page
 * The main container for a page with improved responsive behavior.
 * Supports different size variants for content width constraints.
 */
interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
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

const PageContext = React.createContext<{ size: PageProps['size'] }>({
  size: 'lg',
})

function Page({ className, size = 'lg', ref, ...props }: PageProps) {
  return (
    <PageContext.Provider value={{ size }}>
      <div
        ref={ref}
        className={cn(
          'flex h-full min-h-0 flex-col bg-background text-foreground',
          className,
        )}
        {...props}
      />
    </PageContext.Provider>
  )
}

/**
 * PageHeader
 * Enhanced header with better responsive behavior and visual hierarchy.
 */
interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  ref?: React.Ref<HTMLElement>
  sticky?: boolean
  /**
   * Border variant
   * - default: border-b
   * - none: no border
   * - shadow: subtle shadow instead of border
   */
  border?: 'default' | 'none' | 'shadow'
  /**
   * Size affects padding
   */
  size?: 'sm' | 'md' | 'lg'
}

function PageHeader({
  className,
  sticky = false,
  border = 'default',
  size = 'md',
  ref,
  ...props
}: PageHeaderProps) {
  const { size: pageSize } = React.useContext(PageContext)

  return (
    <header
      ref={ref}
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-between gap-4',
        // Responsive padding based on size
        size === 'sm' && 'px-4 py-3 md:px-6',
        size === 'md' && 'px-4 py-4 md:px-8 lg:px-10',
        size === 'lg' && 'px-4 py-5 md:px-8 lg:px-12',
        // Sticky behavior with enhanced backdrop
        sticky && [
          'sticky top-0 z-20',
          'bg-background/80 backdrop-blur-xl',
          'supports-backdrop-filter:bg-background/60',
          'transition-all duration-200',
        ],
        // Border variants
        border === 'default' && 'border-b border-border/40',
        border === 'shadow' && 'shadow-sm',
        // Container constraint matching page size
        pageSize !== 'full' && 'mx-auto w-full',
        pageSize === 'sm' && 'max-w-5xl',
        pageSize === 'md' && 'max-w-7xl',
        pageSize === 'lg' && 'max-w-[1536px]',
        pageSize === 'xl' && 'max-w-[1600px]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * PageTitleContainer
 * Wrapper for title and description with improved spacing.
 */
interface PageTitleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function PageTitleContainer({
  className,
  ref,
  ...props
}: PageTitleContainerProps) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 min-w-0', className)}
      {...props}
    />
  )
}

/**
 * PageTitle
 * Primary heading with responsive typography and better hierarchy.
 */
interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: React.Ref<HTMLHeadingElement>
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Truncate long titles
   */
  truncate?: boolean
}

function PageTitle({
  className,
  size = 'md',
  truncate = false,
  ref,
  ...props
}: PageTitleProps) {
  return (
    <h1
      ref={ref}
      className={cn(
        'font-semibold tracking-tight text-foreground',
        // Size variants with better scaling
        size === 'sm' && 'text-xl md:text-2xl',
        size === 'md' && 'text-2xl md:text-3xl lg:text-3xl',
        size === 'lg' && 'text-3xl md:text-4xl lg:text-4xl',
        // Truncate option
        truncate && 'truncate',
        className,
      )}
      {...props}
    />
  )
}

/**
 * PageDescription
 * Secondary text with improved readability.
 */
interface PageDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: React.Ref<HTMLParagraphElement>
  /**
   * Limit width for better readability
   */
  maxWidth?: boolean
}

function PageDescription({
  className,
  maxWidth = false,
  ref,
  ...props
}: PageDescriptionProps) {
  return (
    <p
      ref={ref}
      className={cn(
        'text-sm text-muted-foreground leading-relaxed',
        'md:text-base md:leading-relaxed',
        maxWidth && 'max-w-2xl',
        className,
      )}
      {...props}
    />
  )
}

/**
 * PageActions
 * Wrapper for action buttons with improved responsive behavior.
 */
interface PageActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
  /**
   * Alignment on mobile
   */
  mobileAlign?: 'left' | 'right' | 'stretch'
}

function PageActions({
  className,
  mobileAlign = 'right',
  ref,
  ...props
}: PageActionsProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 md:gap-3',
        // Mobile alignment
        mobileAlign === 'left' && 'justify-start',
        mobileAlign === 'right' && 'justify-end md:justify-start',
        mobileAlign === 'stretch' && 'w-full md:w-auto',
        // Wrap on overflow
        'flex-wrap',
        className,
      )}
      {...props}
    />
  )
}

/**
 * PageContent
 * The scrollable content area with enhanced responsive padding.
 */
interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
  /**
   * Fixed height (fills available space)
   */
  fixedHeight?: boolean
  /**
   * Full width (no horizontal padding or max-width)
   */
  fullWidth?: boolean
  /**
   * Padding size
   */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /**
   * Enable smooth scrolling
   */
  smoothScroll?: boolean
}

function PageContent({
  className,
  fixedHeight = false,
  fullWidth = false,
  padding = 'md',
  smoothScroll = true,
  ref,
  ...props
}: PageContentProps) {
  const { size } = React.useContext(PageContext)

  return (
    <main
      ref={ref}
      className={cn(
        'flex-1 overflow-auto',
        // Smooth scrolling
        smoothScroll && 'scroll-smooth',
        // Scrollbar styling
        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/40',
        // Responsive padding
        !fullWidth && [
          padding === 'sm' && 'px-4 py-4 md:px-6 md:py-6',
          padding === 'md' && 'px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10',
          padding === 'lg' && 'px-4 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12',
        ],
        // Container constraint based on page size
        !fullWidth && 'mx-auto w-full',
        !fullWidth && size === 'sm' && 'max-w-5xl',
        !fullWidth && size === 'md' && 'max-w-7xl',
        !fullWidth && size === 'lg' && 'max-w-[1536px]',
        !fullWidth && size === 'xl' && 'max-w-[1600px]',
        // Fixed height option
        fixedHeight && 'h-full',
        className,
      )}
      {...props}
    />
  )
}

/**
 * PageBreadcrumb
 * Optional breadcrumb section for navigation hierarchy.
 */
interface PageBreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function PageBreadcrumb({ className, ref, ...props }: PageBreadcrumbProps) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 text-sm mb-2', className)}
      {...props}
    />
  )
}

/**
 * PageHeaderContent
 * Wrapper for header content with automatic layout.
 * Stacks on mobile, side-by-side on desktop.
 */
interface PageHeaderContentProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function PageHeaderContent({
  className,
  ref,
  ...props
}: PageHeaderContentProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        'w-full min-w-0',
        className,
      )}
      {...props}
    />
  )
}

export {
  Page,
  PageHeader,
  PageHeaderContent,
  PageTitleContainer,
  PageTitle,
  PageDescription,
  PageActions,
  PageContent,
  PageBreadcrumb,
}
