import { createFileRoute } from '@tanstack/react-router'

import { Page } from '@/components/layout/page'

import { ProductTable } from '@/features/product/components/product-table'

export const Route = createFileRoute('/_app/product/')({ component: RouteComponent })

function RouteComponent() {
	return (
		<Page>
			<Page.BlockHeader title="Daftar Produk" />
			<Page.Content>
				<ProductTable />
			</Page.Content>
		</Page>
	)
}
