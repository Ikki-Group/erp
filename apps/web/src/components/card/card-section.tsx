import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'

interface CardSectionProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string
  description?: string
}

export function CardSection({
  title,
  description,
  children,
  ...props
}: CardSectionProps) {
  return (
    <Card size='sm' {...props}>
      <Card.Header className='border-b'>
        <Card.Title>{title}</Card.Title>
        {description && <Card.Description>{description}</Card.Description>}
      </Card.Header>
      <Card.Content className='space-y-4'>{children}</Card.Content>
    </Card>
  )
}
