import type { ComponentProps } from 'react'
import { Card } from '@/components/ui/card'

interface CardSectionProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string
  description?: string
}

/**
 * Render a compact Card section with a header (title and optional description) and content area.
 *
 * @param title - The header title text displayed in the card
 * @param description - Optional subtext displayed beneath the title in the header
 * @param children - Content rendered inside the card's body
 * @returns The Card section React element
 */
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
