export {
	TableCreateDto,
	TableDto,
	TableFilterDto,
	TableStatusEnum,
	TableUpdateDto,
} from '@ikki/contract/pos/table'
export {
	ShiftCloseDto,
	ShiftDetailDto,
	ShiftDto,
	ShiftFilterDto,
	ShiftOpenDto,
	ShiftStatusEnum,
} from '@ikki/contract/pos/shift'
export {
	OrderApplyVoucherDto,
	OrderCompleteDto,
	OrderCreateDto,
	OrderDetailDto,
	OrderDto,
	OrderFilterDto,
	OrderLineDto,
	OrderLineInputDto,
	OrderLineStatusEnum,
	OrderLineSyncDto,
	OrderPaymentDto,
	OrderPaymentRecordDto,
	OrderRemoveVoucherDto,
	OrderStatusEnum,
	OrderTypeEnum,
	OrderVoidDto,
	OrderVoucherApplyResultDto,
} from '@ikki/contract/pos/order'
export {
	VoucherCreateDto,
	VoucherDto,
	VoucherFilterDto,
	VoucherTypeEnum,
	VoucherUpdateDto,
} from '@ikki/contract/pos/voucher'

// ─── UI option lists (web-only) ───

export const ORDER_TYPE_OPTIONS = [
	{ label: 'Dine In', value: 'dine_in' },
	{ label: 'Takeaway', value: 'takeaway' },
] as const

export const VOUCHER_TYPE_OPTIONS = [
	{ label: 'Percentage (%)', value: 'percentage' },
	{ label: 'Fixed (Rp)', value: 'fixed' },
] as const
