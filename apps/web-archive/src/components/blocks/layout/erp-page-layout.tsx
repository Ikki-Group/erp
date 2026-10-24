import type { ReactNode } from 'react'

import { Page } from '@/components/layout/page'

interface ErpPageLayoutProps {
	title: string
	description?: string
	children: ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function ErpPageLayout({ title, description, children, size = 'xl' }: ErpPageLayoutProps) {
	return (
		<Page size={size}>
			<Page.BlockHeader title={title} description={description} />
			<Page.Content>{children}</Page.Content>
		</Page>
	)
}
