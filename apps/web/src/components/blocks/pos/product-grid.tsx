import { useQuery } from '@tanstack/react-query'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { productApi } from '@/features/product'
import type { ProductSelectDto } from '@/features/product'

interface ProductGridProps {
	onAddToCart: (product: ProductSelectDto) => void
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
	const { data: productsData, isLoading } = useQuery(productApi.list.query({}))
	const products = productsData?.data ?? []

	return (
		<div className="flex h-full flex-col gap-4">
			<div className="flex items-center gap-2">
				<Input placeholder="Cari produk..." className="flex-1" />
			</div>
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						Memuat produk...
					</div>
				) : products.length === 0 ? (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						Tidak ada produk tersedia
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{products.map((product) => (
							<Card
								key={product.id}
								className="cursor-pointer hover:shadow-lg transition-shadow"
								onClick={() => onAddToCart(product)}
							>
								<CardContent className="p-4">
									<div className="flex h-full flex-col items-center gap-2">
										<div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
											<span className="text-3xl">🍔</span>
										</div>
										<h3 className="text-center font-semibold">{product.name}</h3>
										<p className="text-center text-sm text-muted-foreground">
											Rp {product.basePrice?.toLocaleString('id-ID') || '0'}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
