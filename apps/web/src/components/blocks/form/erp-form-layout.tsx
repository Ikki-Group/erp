import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'

interface ErpFormLayoutProps {
	title: string
	description?: string
	children: ReactNode
	footer?: ReactNode
}

export function ErpFormLayout({ title, description, children, footer }: ErpFormLayoutProps) {
	return (
		<Card className="w-full max-w-4xl mx-auto">
			<Card.Header>
				<Card.Title>{title}</Card.Title>
				{description && <Card.Description>{description}</Card.Description>}
			</Card.Header>
			<Card.Content className="space-y-6">{children}</Card.Content>
			{footer && <Card.Footer>{footer}</Card.Footer>}
		</Card>
	)
}
