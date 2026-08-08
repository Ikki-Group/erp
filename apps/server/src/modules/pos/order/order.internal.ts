import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

// ─── Error Factories ───

export const OrderError = {
	notFound: (id: number) =>
		new NotFoundError('Order not found', {
			code: 'ORDER_NOT_FOUND',
			context: { id },
		}),
	notOpen: (id: number) =>
		new BadRequestError('Order is not in open status', {
			code: 'ORDER_NOT_OPEN',
			context: { id },
		}),
	noActiveShift: (userId: number, locationId: number) =>
		new BadRequestError('No active shift found at this location', {
			code: 'NO_ACTIVE_SHIFT',
			context: { userId, locationId },
		}),
	notFullyPaid: (orderId: number, remaining: number) =>
		new BadRequestError('Order is not fully paid', {
			code: 'ORDER_NOT_FULLY_PAID',
			context: { orderId, remaining },
		}),
	paymentExceedsTotal: (orderId: number, excess: number) =>
		new BadRequestError('Payment amount exceeds remaining balance', {
			code: 'PAYMENT_EXCEEDS_TOTAL',
			context: { orderId, excess },
		}),
	menuItemNotFound: (menuItemId: number) =>
		new NotFoundError('Menu item not found', {
			code: 'MENU_ITEM_NOT_FOUND',
			context: { menuItemId },
		}),
	menuItemWrongLocation: (menuItemId: number, locationId: number) =>
		new BadRequestError('Menu item does not belong to order location', {
			code: 'MENU_ITEM_WRONG_LOCATION',
			context: { menuItemId, locationId },
		}),
	paymentMethodNotAvailable: (methodId: number, locationId: number) =>
		new BadRequestError('Payment method not available at this location', {
			code: 'PAYMENT_METHOD_NOT_AVAILABLE',
			context: { methodId, locationId },
		}),
	voucherAlreadyApplied: (orderId: number) =>
		new BadRequestError('A voucher is already applied to this order', {
			code: 'VOUCHER_ALREADY_APPLIED',
			context: { orderId },
		}),
	noVoucherApplied: (orderId: number) =>
		new BadRequestError('No voucher is applied to this order', {
			code: 'NO_VOUCHER_APPLIED',
			context: { orderId },
		}),
	createFailed: () =>
		new InternalServerError('Order creation failed', {
			code: 'ORDER_CREATE_FAILED',
		}),
	updateFailed: (id: number) =>
		new InternalServerError('Order update failed', {
			code: 'ORDER_UPDATE_FAILED',
			context: { id },
		}),
	paymentFailed: (orderId: number) =>
		new InternalServerError('Payment recording failed', {
			code: 'ORDER_PAYMENT_FAILED',
			context: { orderId },
		}),
}
