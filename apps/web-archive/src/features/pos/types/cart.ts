import type { CustomerDto } from '@/features/crm'
import type { ProductSelectDto } from '@/features/product'

export interface CartItem {
	product: ProductSelectDto
	quantity: number
	price: number
}

export interface CartState {
	items: CartItem[]
	customer: CustomerDto | null
	tableNumber: string | null
}

export const initialCartState: CartState = {
	items: [],
	customer: null,
	tableNumber: null,
}
