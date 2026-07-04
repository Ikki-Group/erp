import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { LocationPaymentMethodRepo } from './location-payment-method/location-payment-method.repo'
import { initLocationPaymentMethodRoute } from './location-payment-method/location-payment-method.route'
import { LocationPaymentMethodService } from './location-payment-method/location-payment-method.service'
import { createPaymentMethodModule } from './payment-method/payment-method.module'
import { initPaymentMethodRoute } from './payment-method/payment-method.route'
import { createPaymentProviderModule } from './payment-provider/payment-provider.module'
import { initPaymentProviderRoute } from './payment-provider/payment-provider.route'
import { PaymentRepo } from './payment/payment.repo'
import { initPaymentRoute } from './payment/payment.route'
import { PaymentService } from './payment/payment.service'

export class PaymentServiceModule {
	public readonly paymentMethod: ReturnType<typeof createPaymentMethodModule>
	public readonly payment: PaymentService
	public readonly paymentProvider: ReturnType<typeof createPaymentProviderModule>
	public readonly locationPaymentMethod: LocationPaymentMethodService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		this.paymentMethod = createPaymentMethodModule(this.db, this.cacheClient)

		const paymentRepo = new PaymentRepo(this.db)
		this.payment = new PaymentService(paymentRepo, this.cacheClient)

		this.paymentProvider = createPaymentProviderModule(this.db, this.cacheClient)

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

export { PaymentDto, PaymentInvoiceDto, PaymentTypeDto } from './payment/payment.contract'
export type { PaymentService } from './payment/payment.service'
export {
	PaymentMethodDto,
	PaymentMethodCreateDto,
	PaymentMethodUpdateDto,
	PaymentMethodFilterDto,
	PaymentMethodCategoryDto,
	PaymentMethodTypeDto,
} from './payment-method/payment-method.contract'
export type { IPaymentMethodRepo } from './payment-method/payment-method.repo'
export type { PaymentMethodModule } from './payment-method/payment-method.module'
export {
	PaymentProviderDto,
	PaymentProviderCreateDto,
	PaymentProviderUpdateDto,
	PaymentProviderFilterDto,
} from './payment-provider/payment-provider.contract'
export type { IPaymentProviderRepo } from './payment-provider/payment-provider.repo'
export type { PaymentProviderModule } from './payment-provider/payment-provider.module'
export {
	LocationPaymentMethodDto,
	LocationPaymentMethodCreateDto,
	LocationPaymentMethodUpdateDto,
	LocationPaymentMethodFilterDto,
	LocationPaymentMethodCredentialsDto,
	LocationPaymentMethodConfigDto,
} from './location-payment-method/location-payment-method.contract'
export type { LocationPaymentMethodService } from './location-payment-method/location-payment-method.service'
