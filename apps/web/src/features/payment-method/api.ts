import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'
import { defineQuery, defineResource } from '@/lib/api/index.ts'
import { createSuccessResponseSchema } from '@/lib/validation/index.ts'

import {
	PaymentMethodCreateDto,
	PaymentMethodDto,
	PaymentMethodFilterDto,
	PaymentMethodUpdateDto,
} from './dto/index.ts'

// ─── Payment Method Resource (CRUD) ───

export const paymentMethodResource = defineResource({
	urls: endpoint.paymentMethod,
	entitySchema: PaymentMethodDto,
	filter: PaymentMethodFilterDto,
	create: PaymentMethodCreateDto,
	update: PaymentMethodUpdateDto,
})

// ─── By-Location Query ───

const byLocationUrl = endpoint.paymentMethod.byLocation

const byLocationQuery = defineQuery({
	method: 'get',
	url: byLocationUrl,
	query: z.object({ locationId: z.coerce.number().int().positive() }),
	result: createSuccessResponseSchema(z.array(PaymentMethodDto)),
	queryKey: (query) => [byLocationUrl, query],
})

export const paymentMethodByLocation = {
	keys: {
		all: () => [byLocationUrl] as const,
		list: (locationId: number) => [byLocationUrl, { locationId }] as const,
	},
	query: byLocationQuery,
}
