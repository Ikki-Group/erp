import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import { PaymentMethodConfigRepo } from './payment-method/payment-method.repo'
import { initPaymentMethodRoute } from './payment-method/payment-method.route'
import { PaymentMethodConfigService } from './payment-method/payment-method.service'
import { PaymentRepo } from './payment/payment.repo'
import { initPaymentRoute } from './payment/payment.route'
import { PaymentService } from './payment/payment.service'

export class PaymentServiceModule {
	public readonly paymentMethod: PaymentMethodConfigService
	public readonly payment: PaymentService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const paymentMethodConfigRepo = new PaymentMethodConfigRepo(this.db)
		this.paymentMethod = new PaymentMethodConfigService(paymentMethodConfigRepo, this.cacheClient)

		const paymentRepo = new PaymentRepo(this.db)
		this.payment = new PaymentService(paymentRepo, this.cacheClient)
	}
}

export function initPaymentRouteModule(s: PaymentServiceModule) {
	return new Elysia({ prefix: '/payment' })
		.use(initPaymentMethodRoute(s.paymentMethod))
		.use(initPaymentRoute(s.payment))
}

export {
	PaymentDto,
	PaymentInvoiceDto,
	PaymentTypeDto,
	PaymentMethodDto,
} from './payment/payment.dto'
export type { PaymentService } from './payment/payment.service'
export {
	PaymentMethodConfigDto,
	PaymentMethodCategoryDto,
	PaymentMethodTypeDto,
} from './payment-method/payment-method.dto'
export type { PaymentMethodConfigService } from './payment-method/payment-method.service'
