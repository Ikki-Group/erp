export {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodTypeEnum,
	PaymentMethodUpdateDto,
} from '@ikki/contract/payment-method'

export const PAYMENT_METHOD_TYPE_OPTIONS = [
	{ label: 'Cash', value: 'cash' },
	{ label: 'Digital', value: 'digital' },
] as const
