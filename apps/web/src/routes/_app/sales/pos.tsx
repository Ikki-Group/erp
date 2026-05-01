import React from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import {
	ShoppingCartIcon,
	SearchIcon,
	PlusIcon,
	MinusIcon,
	Trash2Icon,
	SaveIcon,
	CreditCardIcon,
	BanknoteIcon,
	SmartphoneIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Page } from '@/components/layout/page'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { productApi } from '@/features/product'
import type { ProductDto } from '@/features/product'
import { salesOrderApi } from '@/features/sales'
import { salesTypeApi } from '@/features/sales-type'

export const Route = createFileRoute('/_app/sales/pos')({ component: POSPage })

interface CartItem {
	productId: number
	productName: string
	price: number
	quantity: number
	subtotal: number
}

type PaymentMethod = 'cash' | 'card' | 'transfer'

function POSPage() {
	const [cart, setCart] = React.useState<CartItem[]>([])
	const [selectedCustomer, setSelectedCustomer] = React.useState<number | null>(null)
	const [selectedSalesType, setSelectedSalesType] = React.useState<number | null>(null)
	const [searchQuery, setSearchQuery] = React.useState('')
	const [showPayment, setShowPayment] = React.useState(false)
	const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>('cash')
	const [paymentAmount, setPaymentAmount] = React.useState('')
	const [createdOrderId, setCreatedOrderId] = React.useState<number | null>(null)

	// Fetch products
	const { data: products, isLoading: productsLoading } = useQuery(
		productApi.list.query({ page: 1, limit: 100, q: searchQuery }),
	)

	// Fetch sales types
	const { data: salesTypes, isLoading: salesTypesLoading } = useQuery(
		salesTypeApi.list.query({ page: 1, limit: 100 }),
	)

	// Create order mutation
	const createOrderMutation = useMutation({
		mutationFn: salesOrderApi.create.mutationFn,
		onSuccess: (data) => {
			const orderId = data.data.id
			setCreatedOrderId(orderId)
			setShowPayment(true)
			toast.success('Pesanan berhasil dibuat')
		},
		onError: (error) => {
			toast.error('Gagal membuat pesanan')
			console.error(error)
		},
	})

	// Close order mutation
	const closeOrderMutation = useMutation({
		mutationFn: salesOrderApi.close.mutationFn,
		onSuccess: () => {
			toast.success('Pembayaran berhasil')
			setCart([])
			setSelectedCustomer(null)
			setSelectedSalesType(null)
			setShowPayment(false)
			setCreatedOrderId(null)
			setPaymentAmount('')
		},
		onError: (error) => {
			toast.error('Gagal memproses pembayaran')
			console.error(error)
		},
	})

	const addToCart = (product: ProductDto) => {
		const existingItem = cart.find((item) => item.productId === product.id)
		if (existingItem) {
			setCart(
				cart.map((item) =>
					item.productId === product.id
						? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
						: item,
				),
			)
		} else {
			setCart([
				...cart,
				{
					productId: product.id,
					productName: product.name,
					price: product.basePrice ?? 0,
					quantity: 1,
					subtotal: product.basePrice ?? 0,
				},
			])
		}
	}

	const removeFromCart = (productId: number) => {
		setCart(cart.filter((item) => item.productId !== productId))
	}

	const updateQuantity = (productId: number, delta: number) => {
		setCart(
			cart.map((item) =>
				item.productId === productId
					? {
							...item,
							quantity: Math.max(1, item.quantity + delta),
							subtotal: Math.max(1, item.quantity + delta) * item.price,
						}
					: item,
			),
		)
	}

	const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

	const handleCreateOrder = () => {
		if (cart.length === 0) {
			toast.error('Keranjang kosong')
			return
		}
		if (!selectedSalesType) {
			toast.error('Pilih tipe penjualan')
			return
		}

		createOrderMutation.mutate({
			body: {
				locationId: 1, // TODO: Get from context
				customerId: selectedCustomer,
				salesTypeId: selectedSalesType,
				status: 'open',
				transactionDate: new Date().toISOString(),
				totalAmount: cartTotal,
				discountAmount: 0,
				taxAmount: 0,
				items: cart.map((item) => ({
					productId: item.productId,
					itemName: item.productName,
					quantity: item.quantity,
					unitPrice: item.price,
					discountAmount: 0,
					taxAmount: 0,
					subtotal: item.subtotal,
				})),
			},
		})
	}

	const handlePayment = () => {
		if (!createdOrderId) return

		const amount = Number(paymentAmount)
		if (isNaN(amount) || amount < cartTotal) {
			toast.error('Jumlah pembayaran tidak cukup')
			return
		}

		closeOrderMutation.mutate({
			params: { id: createdOrderId },
		})
	}

	const handleCancelPayment = () => {
		setShowPayment(false)
		setCreatedOrderId(null)
		setPaymentAmount('')
	}

	const filteredProducts =
		products?.data?.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ?? []

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Point of Sale"
				description="Buat pesanan penjualan dengan cepat dan mudah."
			/>
			<Page.Content>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left Column - Products */}
					<div className="lg:col-span-2 space-y-4">
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<SearchIcon className="h-5 w-5 text-muted-foreground" />
									<Input
										placeholder="Cari produk..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="flex-1"
									/>
								</div>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-[500px]">
									<div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
										{productsLoading ? (
											<div className="col-span-full text-center py-8">Memuat produk...</div>
										) : filteredProducts.length === 0 ? (
											<div className="col-span-full text-center py-8 text-muted-foreground">
												Tidak ada produk ditemukan
											</div>
										) : (
											filteredProducts.map((product) => (
												<Card
													key={product.id}
													className="cursor-pointer hover:bg-accent transition-colors"
													onClick={() => addToCart(product)}
												>
													<CardContent className="p-4">
														<div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
															<ShoppingCartIcon className="h-8 w-8 text-muted-foreground" />
														</div>
														<h3 className="font-medium text-sm mb-1 line-clamp-2">
															{product.name}
														</h3>
														<p className="text-sm font-semibold">
															Rp {((product.basePrice ?? 0) / 1000).toFixed(0)}k
														</p>
													</CardContent>
												</Card>
											))
										)}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					</div>

					{/* Right Column - Cart */}
					<div className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShoppingCartIcon className="h-5 w-5" />
									Keranjang
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Sales Type Selection */}
								<div className="space-y-2">
									<label className="text-sm font-medium">Tipe Penjualan</label>
									{salesTypesLoading ? (
										<div className="text-sm text-muted-foreground">Memuat tipe penjualan...</div>
									) : (
										<div className="flex flex-wrap gap-2">
											{salesTypes?.data?.map((st) => (
												<Badge
													key={st.id}
													variant={selectedSalesType === st.id ? 'default' : 'outline'}
													className="cursor-pointer"
													onClick={() => setSelectedSalesType(st.id)}
												>
													{st.name}
												</Badge>
											))}
										</div>
									)}
								</div>

								<Separator />

								{/* Cart Items */}
								<ScrollArea className="h-[300px]">
									{cart.length === 0 ? (
										<div className="text-center py-8 text-muted-foreground text-sm">
											Keranjang kosong
										</div>
									) : (
										<div className="space-y-3 pr-4">
											{cart.map((item) => (
												<div
													key={item.productId}
													className="flex items-center gap-2 p-2 bg-muted rounded-lg"
												>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate">{item.productName}</p>
														<p className="text-xs text-muted-foreground">
															Rp {item.price.toLocaleString('id-ID')}
														</p>
													</div>
													<div className="flex items-center gap-1">
														<Button
															variant="outline"
															size="icon-sm"
															onClick={() => updateQuantity(item.productId, -1)}
														>
															<MinusIcon className="h-3 w-3" />
														</Button>
														<span className="w-8 text-center text-sm font-medium">
															{item.quantity}
														</span>
														<Button
															variant="outline"
															size="icon-sm"
															onClick={() => updateQuantity(item.productId, 1)}
														>
															<PlusIcon className="h-3 w-3" />
														</Button>
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() => removeFromCart(item.productId)}
														>
															<Trash2Icon className="h-3 w-3 text-destructive" />
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</ScrollArea>

								<Separator />

								{/* Total */}
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Subtotal</span>
										<span>Rp {cartTotal.toLocaleString('id-ID')}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>Pajak</span>
										<span>Rp 0</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>Diskon</span>
										<span>Rp 0</span>
									</div>
									<Separator />
									<div className="flex justify-between text-lg font-bold">
										<span>Total</span>
										<span>Rp {cartTotal.toLocaleString('id-ID')}</span>
									</div>
								</div>

								<Button
									className="w-full"
									size="lg"
									onClick={handleCreateOrder}
									disabled={
										cart.length === 0 || !selectedSalesType || createOrderMutation.isPending
									}
								>
									<SaveIcon className="mr-2 h-5 w-5" />
									Proses ke Pembayaran
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Payment Dialog */}
				{showPayment && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
						<Card className="w-full max-w-md">
							<CardHeader>
								<CardTitle>Pembayaran</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<label className="text-sm font-medium">Total Tagihan</label>
									<div className="text-2xl font-bold">Rp {cartTotal.toLocaleString('id-ID')}</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Metode Pembayaran</label>
									<div className="grid grid-cols-3 gap-2">
										<Button
											variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
											onClick={() => setSelectedPaymentMethod('cash')}
											className="flex flex-col gap-1 h-auto py-3"
										>
											<BanknoteIcon className="h-5 w-5" />
											<span className="text-xs">Tunai</span>
										</Button>
										<Button
											variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
											onClick={() => setSelectedPaymentMethod('card')}
											className="flex flex-col gap-1 h-auto py-3"
										>
											<CreditCardIcon className="h-5 w-5" />
											<span className="text-xs">Kartu</span>
										</Button>
										<Button
											variant={selectedPaymentMethod === 'transfer' ? 'default' : 'outline'}
											onClick={() => setSelectedPaymentMethod('transfer')}
											className="flex flex-col gap-1 h-auto py-3"
										>
											<SmartphoneIcon className="h-5 w-5" />
											<span className="text-xs">Transfer</span>
										</Button>
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Jumlah Bayar</label>
									<Input
										type="number"
										placeholder="Masukkan jumlah bayar"
										value={paymentAmount}
										onChange={(e) => setPaymentAmount(e.target.value)}
									/>
									{paymentAmount && Number(paymentAmount) < cartTotal && (
										<p className="text-xs text-destructive">
											Jumlah bayar kurang Rp{' '}
											{(cartTotal - Number(paymentAmount)).toLocaleString('id-ID')}
										</p>
									)}
									{paymentAmount && Number(paymentAmount) >= cartTotal && (
										<p className="text-xs text-green-600">
											Kembalian: Rp {(Number(paymentAmount) - cartTotal).toLocaleString('id-ID')}
										</p>
									)}
								</div>

								<div className="flex gap-2">
									<Button
										variant="outline"
										className="flex-1"
										onClick={handleCancelPayment}
										disabled={closeOrderMutation.isPending}
									>
										Batal
									</Button>
									<Button
										className="flex-1"
										onClick={handlePayment}
										disabled={
											!paymentAmount ||
											Number(paymentAmount) < cartTotal ||
											closeOrderMutation.isPending
										}
									>
										{closeOrderMutation.isPending ? 'Memproses...' : 'Bayar'}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
			</Page.Content>
		</Page>
	)
}
