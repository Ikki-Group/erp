import { useState, useEffect } from 'react'

import { CartPanel } from '@/components/blocks/pos/cart-panel'
import { CustomerSelector } from '@/components/blocks/pos/customer-selector'
import { OutletSelectionDialog } from '@/components/blocks/pos/outlet-selection-dialog'
import { ProductGrid } from '@/components/blocks/pos/product-grid'
import { SalesModeSelector } from '@/components/blocks/pos/sales-mode-selector'
import { TableNumberInput } from '@/components/blocks/pos/table-number-input'

import type { LocationDto } from '@/features/location'
import { usePosCart } from '@/features/pos/hooks/use-pos-cart'
import type { PaymentItem } from '@/features/pos/types/payment'
import type { SalesTypeDto } from '@/features/sales-type'

export function PosScreen() {
	const [selectedOutlet, setSelectedOutlet] = useState<LocationDto | null>(null)
	const [selectedSalesMode, setSelectedSalesMode] = useState<SalesTypeDto | null>(null)
	const [showOutletDialog, setShowOutletDialog] = useState(true)

	const {
		cart,
		addItem,
		updateQuantity,
		removeItem,
		clearCart,
		setCustomer,
		setTableNumber,
		total,
	} = usePosCart()

	const handleSelectOutlet = (outlet: LocationDto) => {
		setSelectedOutlet(outlet)
		setShowOutletDialog(false)
	}

	const handleAddToCart = (product: (typeof cart.items)[0]['product']) => {
		addItem({
			product,
			quantity: 1,
			price: product.basePrice || 0,
		})
	}

	const handlePaymentComplete = (payments: PaymentItem[]) => {
		// TODO: Save payment to backend
		console.log('Payment completed:', payments)
	}

	const handleOpenBill = () => {
		// TODO: Save open bill to backend
		console.log('Open bill:', cart)
	}

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// F2: Focus search (to be implemented)
			if (e.key === 'F2') {
				e.preventDefault()
				console.log('Focus search')
			}
			// F4: Clear cart
			if (e.key === 'F4') {
				e.preventDefault()
				clearCart()
			}
			// F9: Open payment dialog
			if (e.key === 'F9') {
				e.preventDefault()
				if (cart.items.length > 0) {
					console.log('Open payment dialog')
				}
			}
			// F12: Open bill
			if (e.key === 'F12') {
				e.preventDefault()
				if (cart.items.length > 0) {
					handleOpenBill()
				}
			}
			// Escape: Close dialog
			if (e.key === 'Escape') {
				setShowOutletDialog(false)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [cart.items, clearCart, handleOpenBill])

	return (
		<>
			<OutletSelectionDialog
				open={showOutletDialog}
				onOpenChange={setShowOutletDialog}
				onSelect={handleSelectOutlet}
			/>
			{selectedOutlet ? (
				<div className="flex h-full flex-col gap-4 p-4 md:p-6">
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Outlet:</span>
							<span className="font-semibold">{selectedOutlet.name}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Mode:</span>
							<SalesModeSelector selectedMode={selectedSalesMode} onSelect={setSelectedSalesMode} />
						</div>
						<CustomerSelector
							selectedCustomer={cart.customer}
							onSelect={setCustomer}
							onClear={() => setCustomer(null)}
						/>
						<TableNumberInput value={cart.tableNumber} onChange={setTableNumber} />
					</div>
					<div className="flex flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
						<div className="flex-1">
							<ProductGrid onAddToCart={handleAddToCart} />
						</div>
						<div className="w-full lg:w-[400px] flex-none">
							<CartPanel
								cart={cart}
								total={total}
								onUpdateQuantity={updateQuantity}
								onRemoveItem={removeItem}
								onClearCart={clearCart}
								onPaymentComplete={handlePaymentComplete}
								onOpenBill={handleOpenBill}
							/>
						</div>
					</div>
				</div>
			) : (
				<div className="flex h-full items-center justify-center">
					<p className="text-muted-foreground">Silakan pilih outlet terlebih dahulu</p>
				</div>
			)}
		</>
	)
}
