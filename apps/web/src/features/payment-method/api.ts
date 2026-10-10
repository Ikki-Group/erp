import { zRes } from '@ikki/contract/http'
import { zq } from '@ikki/contract/schema'
import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { defineQuery, defineResource } from '@/lib/api/index.ts'

import {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodUpdateDto,
} from './dto/index.ts'

// ─── Payment Method Resource (CRUD) ───
export const paymentMethodResource = defineResource({
	feature: 'payment-method',
	resource: 'payment-method',
	urls: endpoint.paymentMethod,
	entitySchema: PaymentMethodDto,
	filter: PaymentMethodFilterDto,
	create: PaymentMethodCreateDto,
	update: PaymentMethodUpdateDto,
})

// ─── By-Location Query ───
// Keyed under the resource root so CRUD mutations (`invalidates: keys.root()`) refresh it.
// The location is an explicit arg (not the active location), so it is not `locationScoped`.
export const paymentMethodByLocation = {
	query: defineQuery({
		method: 'get',
		url: endpoint.paymentMethod.byLocation,
		query: z.object({ locationId: zq.id }),
		result: zRes.ok(z.array(PaymentMethodDto)),
		queryKey: (query) => paymentMethodResource.keys.list({ byLocation: query }),
	}),
}
