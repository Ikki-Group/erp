import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { createLocationPaymentMethodModule } from './location-payment-method/location-payment-method.module'
import { createLocationPaymentMethodRoute } from './location-payment-method/location-payment-method.route'
import { createPaymentMethodModule } from './payment-method/payment-method.module'
import { initPaymentMethodRoute } from './payment-method/payment-method.route'
import { createPaymentProviderModule } from './payment-provider/payment-provider.module'
import { initPaymentProviderRoute } from './payment-provider/payment-provider.route'
import { createPaymentModule, type PaymentModule } from './payment/payment.module'
import { createPaymentRoute } from './payment/payment.route'

export interface PaymentServiceModule {
	paymentMethod: ReturnType<typeof createPaymentMethodModule>
	payment: PaymentModule
	paymentProvider: ReturnType<typeof createPaymentProviderModule>
	locationPaymentMethod: ReturnType<typeof createLocationPaymentMethodModule>
}

export function createPaymentServiceModule(
	db: DbClient,
	cacheClient: CacheClient,
): PaymentServiceModule {
	const paymentMethod = createPaymentMethodModule(db, cacheClient)

	const payment = createPaymentModule(db, cacheClient)

	const paymentProvider = createPaymentProviderModule(db, cacheClient)

	// NOTE: `location` dep is intentionally satisfied by `paymentMethod` here (pre-existing
	// behavior, preserved as-is) — both narrow ports (`LocationReadPort`/`PaymentMethodReadPort`)
	// are structurally satisfied by `PaymentMethodService`.
	const locationPaymentMethod = createLocationPaymentMethodModule(db, cacheClient, {
		location: paymentMethod,
		paymentMethod,
	})

	return { paymentMethod, payment, paymentProvider, locationPaymentMethod }
}

export function initPaymentRouteModule(s: PaymentServiceModule) {
	return new Elysia({ prefix: '/payment' })
		.use(initPaymentMethodRoute(s.paymentMethod))
		.use(createPaymentRoute(s.payment))
		.use(initPaymentProviderRoute(s.paymentProvider))
		.use(createLocationPaymentMethodRoute(s.locationPaymentMethod))
}

export { PaymentDto, PaymentInvoiceDto, PaymentTypeDto } from './payment/payment.contract'
export type { PaymentModule } from './payment/payment.module'
export { createPaymentModule } from './payment/payment.module'
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
export type { ILocationPaymentMethodRepo } from './location-payment-method/location-payment-method.repo'
export type { LocationPaymentMethodModule, LocationReadPort, PaymentMethodReadPort } from './location-payment-method/location-payment-method.module'
