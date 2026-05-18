import { zp, createSuccessResponseSchema } from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { res } from '@/shared/http/response'

import type { SeedService } from './seed.service'

export function initSeedRoute(seedSvc: SeedService) {
	return new Elysia({ prefix: '/seed' }).post(
		'/',
		async function seed() {
			await seedSvc.seed()
			return res.ok('Seeding data...')
		},
		{ response: createSuccessResponseSchema(zp.str) },
	)
}
