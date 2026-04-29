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
		<Card size="sm" {...props}>
			<Card.Header className="border-b px-4 py-3">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						{icon}
						<Card.Title className="text-base">{title}</Card.Title>
					</div>
					{action && <Card.Action>{action}</Card.Action>}
				</div>
				{description && <Card.Description className="mt-1">{description}</Card.Description>}
			</Card.Header>
			<Card.Content className="space-y-4 px-4 py-3">{children}</Card.Content>
		</Card>
	)
}
