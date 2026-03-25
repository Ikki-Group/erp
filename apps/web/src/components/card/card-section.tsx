import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'

interface CardSectionProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

/**
 * Render a compact Card section with a header (title, optional icon, description and action) and content area.
 */
export function CardSection({
  title,
  description,
  icon,
  action,
  children,
  ...props
}: CardSectionProps) {
  return (
    <Card size='sm' {...props}>
      <Card.Header className='border-b'>
        <Card.Title className='flex items-center gap-2'>
          {icon}
          <span>{title}</span>
        </Card.Title>
        {description && <Card.Description>{description}</Card.Description>}
        {action && <Card.Action>{action}</Card.Action>}
      </Card.Header>
      <Card.Content className='space-y-4 pt-1'>{children}</Card.Content>
    </Card>
  )
}
