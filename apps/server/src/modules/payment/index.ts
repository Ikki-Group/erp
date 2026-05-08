import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { LocationPaymentMethodRepo } from './location-payment-method/location-payment-method.repo'
import { initLocationPaymentMethodRoute } from './location-payment-method/location-payment-method.route'
import { LocationPaymentMethodService } from './location-payment-method/location-payment-method.service'
import { PaymentMethodConfigRepo } from './payment-method/payment-method.repo'
import { initPaymentMethodRoute } from './payment-method/payment-method.route'
import { PaymentMethodConfigService } from './payment-method/payment-method.service'
import { PaymentProviderRepo } from './payment-provider/payment-provider.repo'
import { initPaymentProviderRoute } from './payment-provider/payment-provider.route'
import { PaymentProviderService } from './payment-provider/payment-provider.service'
import { PaymentRepo } from './payment/payment.repo'
import { initPaymentRoute } from './payment/payment.route'
import { PaymentService } from './payment/payment.service'

export class PaymentServiceModule {
	public readonly paymentMethod: PaymentMethodConfigService
	public readonly payment: PaymentService
	public readonly paymentProvider: PaymentProviderService
	public readonly locationPaymentMethod: LocationPaymentMethodService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const paymentMethodConfigRepo = new PaymentMethodConfigRepo(this.db)
		this.paymentMethod = new PaymentMethodConfigService(paymentMethodConfigRepo, this.cacheClient)

		const paymentRepo = new PaymentRepo(this.db)
		this.payment = new PaymentService(paymentRepo, this.cacheClient)

		const paymentProviderRepo = new PaymentProviderRepo(this.db)
		this.paymentProvider = new PaymentProviderService(paymentProviderRepo, this.cacheClient)

		const locationPaymentMethodRepo = new LocationPaymentMethodRepo(this.db)
		this.locationPaymentMethod = new LocationPaymentMethodService(
			locationPaymentMethodRepo,
			this.cacheClient,
		)
	}
}

export function initPaymentRouteModule(s: PaymentServiceModule) {
	return new Elysia({ prefix: '/payment' })
		.use(initPaymentMethodRoute(s.paymentMethod))
		.use(initPaymentRoute(s.payment))
		.use(initPaymentProviderRoute(s.paymentProvider))
		.use(initLocationPaymentMethodRoute(s.locationPaymentMethod))
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
export {
	PaymentProviderDto,
	PaymentProviderCreateDto,
	PaymentProviderUpdateDto,
	PaymentProviderFilterDto,
} from './payment-provider/payment-provider.dto'
export type { PaymentProviderService } from './payment-provider/payment-provider.service'
export {
	LocationPaymentMethodDto,
	LocationPaymentMethodCreateDto,
	LocationPaymentMethodUpdateDto,
	LocationPaymentMethodFilterDto,
	LocationPaymentMethodCredentialsDto,
	LocationPaymentMethodConfigDto,
} from './location-payment-method/location-payment-method.dto'
export type { LocationPaymentMethodService } from './location-payment-method/location-payment-method.service'
