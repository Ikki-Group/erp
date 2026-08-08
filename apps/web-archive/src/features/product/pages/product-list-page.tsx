import { Page } from '@/components/layout/page'

import { ProductTable } from '../components/product-table'

export function ProductListPage() {
	return (
		<Page size="xl">
			<Page.BlockHeader title="Daftar Produk" />
			<Page.Content>
				<ProductTable />
			</Page.Content>
		</Page>
	)
}
