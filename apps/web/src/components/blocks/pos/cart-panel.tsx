import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import type { CartState } from '@/features/pos/types/cart'

interface CartPanelProps {
	cart: CartState
	total: number
	onUpdateQuantity: (productId: number, quantity: number) => void
	onRemoveItem: (productId: number) => void
	onClearCart: () => void
}

export function CartPanel({
	cart,
	total,
	onUpdateQuantity,
	onRemoveItem,
	onClearCart,
}: CartPanelProps) {
	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="flex-none">
				<div className="flex items-center justify-between">
					<CardTitle>Keranjang</CardTitle>
					<Button variant="ghost" size="sm" onClick={onClearCart}>
						Kosongkan
					</Button>
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
				<div className="flex-1 overflow-y-auto">
					{cart.items.length === 0 ? (
						<div className="flex h-full items-center justify-center text-muted-foreground">
							Keranjang kosong
						</div>
					) : (
						<div className="space-y-2">
							{cart.items.map((item) => (
								<div
									key={item.product.id}
									className="flex items-center gap-2 rounded-lg border p-3"
								>
									<div className="flex-1">
										<p className="font-medium">{item.product.name}</p>
										<p className="text-sm text-muted-foreground">
											Rp {item.price.toLocaleString('id-ID')}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
										>
											-
										</Button>
										<Input
											type="number"
											value={item.quantity}
											onChange={(e) =>
												onUpdateQuantity(item.product.id, Number.parseInt(e.target.value, 10) || 0)
											}
											className="h-8 w-16 text-center"
											min={1}
										/>
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
										>
											+
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-destructive"
											onClick={() => onRemoveItem(item.product.id)}
										>
											×
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
				<div className="flex-none space-y-2 border-t pt-4">
					<div className="flex items-center justify-between text-lg font-semibold">
						<span>Total</span>
						<span>Rp {total.toLocaleString('id-ID')}</span>
					</div>
					<Button className="w-full" disabled={cart.items.length === 0}>
						Bayar
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
