export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'e-wallet'

export interface PaymentItem {
	method: PaymentMethod
	amount: number
}

export interface PaymentState {
	items: PaymentItem[]
	totalPaid: number
	change: number
	isComplete: boolean
}

export const initialPaymentState: PaymentState = {
	items: [],
	totalPaid: 0,
	change: 0,
	isComplete: false,
}
