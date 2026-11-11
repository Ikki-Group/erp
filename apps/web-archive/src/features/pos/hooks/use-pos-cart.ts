import { useState } from 'react'

import type { CartItem, CartState } from '../types/cart'
import { initialCartState } from '../types/cart'

export function usePosCart() {
	const [cart, setCart] = useState<CartState>(initialCartState)

	const addItem = (item: CartItem) => {
		setCart((prev) => {
			const existingIndex = prev.items.findIndex((i) => i.product.id === item.product.id)
			if (existingIndex >= 0) {
				const newItems = [...prev.items]
				const existingItem = newItems[existingIndex]
				if (existingItem) {
					newItems[existingIndex] = {
						...existingItem,
						quantity: existingItem.quantity + item.quantity,
					}
				}
				return { ...prev, items: newItems }
			}
			return { ...prev, items: [...prev.items, item] }
		})
	}

	const updateQuantity = (productId: number, quantity: number) => {
		setCart((prev) => ({
			...prev,
			items: prev.items
				.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
				.filter((item) => item.quantity > 0),
		}))
	}

	const removeItem = (productId: number) => {
		setCart((prev) => ({
			...prev,
			items: prev.items.filter((item) => item.product.id !== productId),
		}))
	}

	const clearCart = () => {
		setCart(initialCartState)
	}

	const setCustomer = (customer: typeof cart.customer) => {
		setCart((prev) => ({ ...prev, customer }))
	}

	const setTableNumber = (tableNumber: string | null) => {
		setCart((prev) => ({ ...prev, tableNumber }))
	}

	const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

	return {
		cart,
		addItem,
		updateQuantity,
		removeItem,
		clearCart,
		setCustomer,
		setTableNumber,
		total,
	}
}
