import { Money } from '@/shared/domain/money.ts'

import { VoucherValidationReason } from './voucher.internal.ts'
import type { VoucherDto, VoucherValidateResponseDto } from '@ikki/contract/pos/voucher'

type VoucherTerms = Pick<
	VoucherDto,
	| 'isActive'
	| 'validFrom'
	| 'validUntil'
	| 'usageLimit'
	| 'usageCount'
	| 'minPurchase'
	| 'type'
	| 'value'
	| 'maxDiscount'
>

const rejected = (reason: string): VoucherValidateResponseDto => ({
	valid: false,
	discountAmount: '0',
	reason,
})

/** Validates a voucher against an order amount at `now` and computes its discount (ADR-0013 §7). */
export function evaluateVoucher(
	voucher: VoucherTerms | undefined,
	orderTotal: Money,
	now: Date,
): VoucherValidateResponseDto {
	if (!voucher) return rejected(VoucherValidationReason.NOT_FOUND)
	if (!voucher.isActive) return rejected(VoucherValidationReason.INACTIVE)
	if (now < voucher.validFrom || now > voucher.validUntil) {
		return rejected(VoucherValidationReason.EXPIRED)
	}
	if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
		return rejected(VoucherValidationReason.USAGE_LIMIT_REACHED)
	}
	if (voucher.minPurchase !== null && orderTotal.lt(Money.of(voucher.minPurchase))) {
		return rejected(VoucherValidationReason.BELOW_MIN_PURCHASE)
	}
	let discount =
		voucher.type === 'percentage' ? orderTotal.percent(voucher.value) : Money.of(voucher.value)
	if (voucher.maxDiscount !== null && discount.gt(Money.of(voucher.maxDiscount))) {
		discount = Money.of(voucher.maxDiscount)
	}
	return { valid: true, discountAmount: discount.toAmount() }
}
