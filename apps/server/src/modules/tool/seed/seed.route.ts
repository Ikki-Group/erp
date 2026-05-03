import Elysia from 'elysia'

import { res } from '@/core/http/response'

import type { SeedService } from './seed.service'
import { zp, createSuccessResponseSchema } from '@/lib/validation'

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
