import Elysia from 'elysia'

import { res } from '@/core/http/response'
import { zp, createSuccessResponseSchema } from '@/core/validation'

import type { SeedService } from '../service/seed.service'

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
